import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, JwtResponse, UserType } from '../../shared/models/user.model';
import { Correspondente } from '../../shared/models/correspondente.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';
import { CorrespondenteService } from './correspondente.service';

/**
 * Service for authentication and user session management in the CRA system
 * Handles user login, registration, token management, and user role verification
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private correspondenteService: CorrespondenteService
  ) {
    const storedUser = localStorage.getItem('currentUser');
    
    let parsedUser: User | null = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    this.currentUserSubject = new BehaviorSubject<User | null>(parsedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /**
   * Gets the current user value from the BehaviorSubject
   * 
   * @returns The current user object or null if not authenticated
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Checks if the user is currently authenticated
   * 
   * @returns True if the user is authenticated, false otherwise
   */
  public get isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Gets the role of the current user
   * 
   * @returns The user's role or null if not available
   */
  public get userRole(): string | null {
    const user = this.currentUserValue;
    if (!user || !user.authorities || user.authorities.length === 0) {
      return null;
    }
    return user.authorities[0];
  }

  /**
   * Checks if the current user has a specific role
   * 
   * @param role The role to check for
   * @returns True if the user has the specified role, false otherwise
   */
  public hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.authorities?.includes(role) || false;
  }

  /**
   * Checks if the current user is an administrator
   * 
   * @returns True if the user is an administrator, false otherwise
   */
  public isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  /**
   * Property version of isAdmin for template usage
   */
  public get isAdminUser(): boolean {
    return this.isAdmin();
  }

  /**
   * Checks if the current user is a lawyer (Advogado)
   * 
   * @returns True if the user is a lawyer, false otherwise
   */
  public isAdvogado(): boolean {
    return this.hasRole('ROLE_ADVOGADO');
  }

  /**
   * Property version of isAdvogado for template usage
   */
  public get isAdvogadoUser(): boolean {
    return this.isAdvogado();
  }

  /**
   * Checks if the current user is a correspondent (Correspondente)
   * 
   * @returns True if the user is a correspondent, false otherwise
   */
  public isCorrespondente(): boolean {
    const user = this.currentUserValue;
    // Check both the user type and role to be sure
    const isCorrespondentType = user?.tipo === UserType.CORRESPONDENTE;
    const hasCorrespondentRole = this.hasRole('ROLE_CORRESPONDENTE');
    return isCorrespondentType || hasCorrespondentRole;
  }

  /**
   * Property version of isCorrespondente for template usage
   */
  public get isCorrespondenteUser(): boolean {
    return this.isCorrespondente();
  }

  /**
   * Checks if the current user has any of the specified roles
   * 
   * @param roles Array of roles to check
   * @returns True if the user has any of the specified roles, false otherwise
   */
  public hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Checks if the current user has all of the specified roles
   * 
   * @param roles Array of roles to check
   * @returns True if the user has all of the specified roles, false otherwise
   */
  public hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }

  /**
   * Authenticates a user with the provided credentials
   * 
   * @param credentials The login credentials containing username and password
   * @returns Observable containing the JWT response with token and user information
   */
  login(credentials: LoginRequest): Observable<JwtResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, credentials, { headers })
      .pipe(
        map(response => {
          // Handle potential case sensitivity or naming differences
          const normalizedResponse = { ...response };
          
          if (!normalizedResponse.emailprincipal && (response as any).emailPrincipal) {
            normalizedResponse.emailprincipal = (response as any).emailPrincipal;
          }
          
          if (!normalizedResponse.nomecompleto && (response as any).nomeCompleto) {
            normalizedResponse.nomecompleto = (response as any).nomeCompleto;
          }
          
          // Fallback: if nomecompleto is still missing, use login as the name
          if (!normalizedResponse.nomecompleto) {
            normalizedResponse.nomecompleto = normalizedResponse.login;
          }
          
          return normalizedResponse;
        }),
        tap(response => {
          // Store JWT token
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          // Create user object from response
          // Ensure we correctly map roles/authorities regardless of backend field name
          const userAuthorities = response.roles || (response as any).authorities || [];
          
          const user: User = {
            id: response.id,
            login: response.login,
            nomecompleto: response.nomecompleto,
            emailprincipal: response.emailprincipal,
            tipo: response.tipo,
            ativo: true,
            authorities: Array.isArray(userAuthorities) ? userAuthorities : [],
            // Include correspondent data if available
            correspondente: response.correspondente
          };
          
          // SPECIAL FIX: Ensure correspondent users have ROLE_CORRESPONDENTE
          if (user.tipo === UserType.CORRESPONDENTE) {
            // Ensure ROLE_CORRESPONDENTE is present in authorities
            if (!user.authorities) {
              user.authorities = ['ROLE_CORRESPONDENTE'];
            } else if (!user.authorities.includes('ROLE_CORRESPONDENTE')) {
              user.authorities = [...user.authorities, 'ROLE_CORRESPONDENTE'];
            }
          }
          
          // If we have a correspondentId but no correspondente object, create a minimal correspondent object
          if (response.correspondentId && !user.correspondente) {
            user.correspondente = { id: response.correspondentId } as Correspondente;
          }
          
          // Store user and notify subscribers
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Registers a new user in the system
   * 
   * @param userData The user registration data
   * @returns Observable containing the API response
   */
  register(userData: RegisterRequest): Observable<ApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post<ApiResponse>(`${this.apiUrl}/register`, userData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Refreshes the JWT token using the refresh token
   * 
   * @returns Observable containing the new JWT response with refreshed token
   */
  refreshToken(): Observable<JwtResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<JwtResponse>(`${this.apiUrl}/refresh`, 
      { refreshToken }, { headers })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves the current user's information from the server
   * 
   * @returns Observable containing the current user's information
   */
  getCurrentUser(): Observable<User> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<User & { correspondentId?: number }>(`${this.apiUrl}/me`, { headers })
      .pipe(
        switchMap(response => {
          // Handle potential case sensitivity or naming differences
          const normalizedUser = { ...response } as User;
          
          if (!normalizedUser.emailprincipal && (response as any).emailPrincipal) {
            normalizedUser.emailprincipal = (response as any).emailPrincipal;
          }
          
          if (!normalizedUser.nomecompleto && (response as any).nomeCompleto) {
            normalizedUser.nomecompleto = (response as any).nomeCompleto;
          }
          
          // Fallback: if nomecompleto is still missing, use login as the name
          if (!normalizedUser.nomecompleto) {
            normalizedUser.nomecompleto = normalizedUser.login || 'Usuário';
          }
          
          // Ensure authorities are properly set from any possible field name
          const possibleAuthorities = response.authorities || (response as any).roles || [];
          
          if (!normalizedUser.authorities || normalizedUser.authorities.length === 0) {
            normalizedUser.authorities = Array.isArray(possibleAuthorities) ? possibleAuthorities : [];
          }
          
          // SPECIAL FIX: Ensure correspondent users have ROLE_CORRESPONDENTE
          if (normalizedUser.tipo === UserType.CORRESPONDENTE) {
            // Ensure ROLE_CORRESPONDENTE is present in authorities
            if (!normalizedUser.authorities) {
              normalizedUser.authorities = ['ROLE_CORRESPONDENTE'];
            } else if (!normalizedUser.authorities.includes('ROLE_CORRESPONDENTE')) {
              normalizedUser.authorities = [...normalizedUser.authorities, 'ROLE_CORRESPONDENTE'];
            }
          }
          
          // Preserve correspondent data from localStorage if not provided by server
          const storedUser = localStorage.getItem('currentUser');
          let storedUserData: User | null = null;
          if (storedUser) {
            try {
              storedUserData = JSON.parse(storedUser);
            } catch (e) {
              console.error('Error parsing stored user data:', e);
            }
          }
          
          // Check if user is a correspondent
          const isCorrespondentUser = normalizedUser.tipo === UserType.CORRESPONDENTE || 
                                    (normalizedUser.authorities && normalizedUser.authorities.includes('ROLE_CORRESPONDENTE'));
          
          // If this is a correspondent user but we don't have correspondent data, fetch it
          if (isCorrespondentUser) {
            // Ensure correspondent data is preserved
            if (response.correspondente) {
              normalizedUser.correspondente = response.correspondente;
            } else if (storedUserData?.correspondente) {
              // Use correspondent data from localStorage as fallback
              normalizedUser.correspondente = storedUserData.correspondente;
            }
            
            // If we have a correspondentId but no correspondente object, create a minimal correspondent object
            const serverCorrespondentId = (response as any).correspondentId || (response as any).correspondenteId || (response as any).correspondente_id;
            if (serverCorrespondentId && !normalizedUser.correspondente) {
              normalizedUser.correspondente = { id: serverCorrespondentId } as Correspondente;
            } else if (storedUserData?.correspondente?.id && !normalizedUser.correspondente) {
              // Use correspondent ID from localStorage as last resort
              normalizedUser.correspondente = { id: storedUserData.correspondente.id } as Correspondente;
            }
            
            // If we still don't have correspondent data but we know this is a correspondent user,
            // try to fetch the correspondent data from the correspondente service
            if (!normalizedUser.correspondente && normalizedUser.id) {
              // We'll handle this after we return the basic user data
              return this.fetchCorrespondentData(normalizedUser);
            }
          }
          
          return new Observable<User>(observer => {
            observer.next(normalizedUser);
            observer.complete();
          });
        }),
        tap(user => {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }
  
  /**
   * Fetches correspondent data for a user when it's missing
   * 
   * @param user The user object to enrich with correspondent data
   * @returns Observable containing the enriched user
   */
  private fetchCorrespondentData(user: User): Observable<User> {
    // Try different approaches to get the correspondent ID
    let correspondentId: number | null = null;
    
    // Check if we have an ID directly in the user's correspondent object
    if (user.correspondente?.id) {
      correspondentId = user.correspondente.id;
    }
    
    // If we still don't have a correspondent ID, we might need to find another way
    if (!correspondentId) {
      // As a last resort, we could try to fetch all correspondents and find one that matches
      // But this is not ideal for performance, so we'll just return the user as is for now
      return new Observable<User>(observer => {
        observer.next(user);
        observer.complete();
      });
    }
    
    // If we have a correspondent ID, fetch the correspondent data
    return this.correspondenteService.getCorrespondenteById(correspondentId).pipe(
      map((correspondente: Correspondente) => {
        return {
          ...user,
          correspondente: correspondente
        };
      }),
      catchError(error => {
        // Return the user as is if we can't fetch the correspondent data
        return new Observable<User>(observer => {
          observer.next(user);
          observer.complete();
        });
      })
    );
  }

  /**
   * Updates the current user data in the service and localStorage
   * 
   * @param user The updated user data
   */
  updateCurrentUser(user: User): void {
    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Update the current user subject
    this.currentUserSubject.next(user);
  }

  /**
   * Refreshes the current user's data from the server
   * 
   * @returns Observable containing the updated user information
   */
  refreshCurrentUser(): Observable<User> {
    return this.getCurrentUser().pipe(
      tap(user => {
        // Update the current user subject with fresh data
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Validates the current JWT token
   * 
   * @returns Observable for the validation response
   */
  validateToken(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.apiUrl}/validate`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Logs out the current user and clears all authentication data
   */
  logout(): void {
    // Remove stored data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    
    // Notify subscribers
    this.currentUserSubject.next(null);
    
    // Redirect to login
    this.router.navigate(['/login']);
  }

  /**
   * Gets the current JWT token from local storage
   * 
   * @returns The JWT token or null if not available
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Gets the current refresh token from local storage
   * 
   * @returns The refresh token or null if not available
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Checks if a JWT token is expired
   * 
   * @param token The JWT token to check
   * @returns True if the token is expired, false otherwise
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Gets the correspondent ID for the current user
   * Tries multiple approaches to find the correspondent ID
   * 
   * @returns Observable containing the correspondent ID or null if not found
   */
  getCorrespondentId(): Observable<number | null> {
    // First, try to get it from the current user
    const currentUser = this.currentUserValue;
    if (currentUser?.correspondente?.id) {
      return new Observable<number | null>(observer => {
        observer.next(currentUser.correspondente!.id!);
        observer.complete();
      });
    }
    
    // Try to get it from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const storedCorrespondentId = parsedUser?.correspondente?.id || parsedUser?.correspondentId || parsedUser?.correspondenteId;
        if (storedCorrespondentId) {
          return new Observable<number | null>(observer => {
            observer.next(storedCorrespondentId);
            observer.complete();
          });
        }
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
    
    // If we still don't have it, try to get fresh user data
    return this.getCurrentUser().pipe(
      map((user: User) => {
        const correspondentId = user?.correspondente?.id;
        return correspondentId || null;
      }),
      catchError(error => {
        return new Observable<number | null>(observer => {
          observer.next(null);
          observer.complete();
        });
      })
    );
  }

  /**
   * Handles HTTP errors for authentication operations
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any) {
    if (error.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
    }
    
    return throwError(() => error);
  }
}    