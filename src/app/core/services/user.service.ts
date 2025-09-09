import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';
import { ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing users in the CRA system
 * Provides CRUD operations and user management functionality
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves all users from the system
   * 
   * @returns Observable containing array of users
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific user by ID
   * 
   * @param id The ID of the user to retrieve
   * @returns Observable containing the requested user
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));

  }

  /**
   * Retrieves correspondent data for a user
   * 
   * @param id The ID of the correspondent to retrieve
   * @returns Observable containing the correspondent data
   */
  getUserCorrespondente(id: number): Observable<any> {
    // This should call the correspondent service endpoint
    return this.http.get<any>(`${environment.apiUrl}/api/correspondentes/${id}`)
      .pipe(catchError(this.handleError));

  }

  /**
   * Creates a new user in the system
   * 
   * @param user The user object to create
   * @returns Observable containing the created user
   */
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing user
   * 
   * @param id The ID of the user to update
   * @param user The updated user data
   * @returns Observable containing the updated user
   */
  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a user from the system
   * 
   * @param id The ID of the user to delete
   * @returns Observable for the delete operation
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Activates a user account
   * 
   * @param id The ID of the user to activate
   * @returns Observable containing the activated user
   */
  activateUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/ativar`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Deactivates a user account
   * 
   * @param id The ID of the user to deactivate
   * @returns Observable containing the deactivated user
   */
  deactivateUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/desativar`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for a user by login
   * 
   * @param login The login to search for
   * @returns Observable containing the found user
   */
  searchUsersByLogin(login: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/buscar/login/${login}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for users by name
   * 
   * @param nome The name to search for
   * @returns Observable containing array of matching users
   */
  searchUsersByName(nome: string): Observable<User[]> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<User[]>(`${this.apiUrl}/buscar/nome`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for users by type
   * 
   * @param tipo The user type to search for
   * @returns Observable containing array of matching users
   */
  searchUsersByType(tipo: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/buscar/tipo/${tipo}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves all active users
   * 
   * @returns Observable containing array of active users
   */
  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/ativos`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('User Service Error:', error);
    throw error;
  }
}