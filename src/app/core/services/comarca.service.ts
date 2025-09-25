import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Comarca } from '../../shared/models/comarca.model';
import { PaginatedResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComarcaService {
  private apiUrl = `${environment.apiUrl}/api/comarcas`;

  constructor(private http: HttpClient) { }

  /**
   * Gets the total count of court districts.
   * 
   * @returns Observable containing the total count
   */
  getComarcasCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new court district.
   * 
   * @param comarca The court district to create
   * @returns The created court district
   */
  createComarca(comarca: Comarca): Observable<Comarca> {
    return this.http.post<Comarca>(this.apiUrl, comarca)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing court district.
   * 
   * @param id The ID of the court district to update
   * @param comarca The updated court district information
   * @returns The updated court district
   */
  updateComarca(id: number, comarca: Comarca): Observable<Comarca> {
    return this.http.put<Comarca>(`${this.apiUrl}/${id}`, comarca)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific court district by ID.
   * 
   * @param id The ID of the court district to retrieve
   * @returns The court district if found
   */
  getComarcaById(id: number): Observable<Comarca> {
    return this.http.get<Comarca>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Lists all court districts with pagination.
   * 
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @param sortBy The field to sort by
   * @param direction The sort direction (ASC or DESC)
   * @returns Paginated list of court districts
   */
  getComarcas(page: number = 0, size: number = 20, sortBy: string = 'nome', direction: string = 'ASC'): Observable<PaginatedResponse<Comarca>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
      
    console.log('Making request to get comarcas with params:', { page, size, sortBy, direction }); // Debug log
    return this.http.get<PaginatedResponse<Comarca>>(this.apiUrl, { params })
      .pipe(
        tap((response: PaginatedResponse<Comarca>) => {
          console.log('Comarcas response:', response); // Debug log
          console.log('Comarcas content length:', response.content?.length); // Debug log
          
          // Ensure response has the correct structure
          if (response && !response.content) {
            response.content = [];
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Lists all court districts without pagination.
   * This is useful for dropdowns and filters where all items are needed.
   * 
   * @returns Observable containing all court districts
   */
  getAllComarcas(): Observable<Comarca[]> {
    console.log('Getting all comarcas without DTO'); // Debug log
    // Get all comarcas with a large page size to ensure we get everything
    return this.getComarcas(0, 10000, 'nome', 'ASC').pipe(
      // Extract the content array from the paginated response
      map(response => {
        console.log('getAllComarcas response:', response); // Debug log
        return response.content || [];
      }),
      catchError(error => {
        console.error('Error in getAllComarcas:', error); // Debug log
        throw error;
      })
    );
  }

  /**
   * Lists all court districts as DTOs with pagination.
   * 
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Paginated list of court districts as DTOs
   */
  getComarcasDto(page: number = 0, size: number = 20): Observable<PaginatedResponse<Comarca>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    console.log('Making request to get comarcas DTO with params:', { page, size }); // Debug log
    return this.http.get<PaginatedResponse<Comarca>>(`${this.apiUrl}/list/dto`, { params })
      .pipe(
        tap((response: PaginatedResponse<Comarca>) => {
          console.log('Comarcas DTO response:', response); // Debug log
          console.log('Comarcas DTO content length:', response.content?.length); // Debug log
          
          // Ensure response has the correct structure
          if (response && !response.content) {
            response.content = [];
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Lists all court districts as DTOs without pagination.
   * This is useful for dropdowns and filters where all items are needed.
   * 
   * @returns Observable containing all court districts as DTOs
   */
  getAllComarcasDto(): Observable<Comarca[]> {
    console.log('Getting all comarcas with DTO'); // Debug log
    // Get all comarcas with a large page size to ensure we get everything
    return this.getComarcasDto(0, 10000).pipe(
      // Extract the content array from the paginated response
      map(response => {
        console.log('getAllComarcasDto response:', response); // Debug log
        return response.content || [];
      }),
      catchError(error => {
        console.error('Error in getAllComarcasDto:', error); // Debug log
        throw error;
      })
    );
  }

  /**
   * Searches court districts by name (partial match) with pagination.
   * 
   * @param nome The name to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @param sortBy The field to sort by
   * @param direction The sort direction (ASC or DESC)
   * @returns Paginated list of matching court districts
   */
  searchByName(nome: string, page: number = 0, size: number = 20, sortBy: string = 'nome', direction: string = 'ASC'): Observable<PaginatedResponse<Comarca>> {
    let params = new HttpParams()
      .set('nome', nome)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
      
    return this.http.get<PaginatedResponse<Comarca>>(`${this.apiUrl}/buscar/nome`, { params })
      .pipe(
        tap((response: PaginatedResponse<Comarca>) => {
          // Ensure response has the correct structure
          if (response && !response.content) {
            response.content = [];
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Finds court districts by state abbreviation (sigla) with pagination.
   * 
   * @param sigla The state abbreviation to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Paginated list of court districts in the specified state
   */
  getByUfSigla(sigla: string, page: number = 0, size: number = 20): Observable<PaginatedResponse<Comarca>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Comarca>>(`${this.apiUrl}/buscar/uf/sigla/${sigla}`, { params })
      .pipe(
        tap((response: PaginatedResponse<Comarca>) => {
          // Ensure response has the correct structure
          if (response && !response.content) {
            response.content = [];
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Deletes a court district.
   * 
   * @param id The ID of the court district to delete
   * @returns void
   */
  deleteComarca(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('Comarca Service Error:', error);
    // Show error to user
    throw error;
  }
}