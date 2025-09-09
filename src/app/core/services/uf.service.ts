import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Uf } from '../../shared/models/uf.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing Brazilian states (Unidades Federativas - UF)
 * Provides CRUD operations and data management for UFs
 */
@Injectable({
  providedIn: 'root'
})
export class UfService {
  private apiUrl = `${environment.apiUrl}/api/ufs`;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves all Brazilian states
   * 
   * @returns Observable containing array of UFs
   */
  getUfs(): Observable<Uf[]> {
    return this.http.get<Uf[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific Brazilian state by ID
   * 
   * @param id The ID of the UF to retrieve
   * @returns Observable containing the requested UF
   */
  getUfById(id: number): Observable<Uf> {
    return this.http.get<Uf>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new Brazilian state
   * 
   * @param uf The UF object to create
   * @returns Observable containing the created UF
   */
  createUf(uf: Uf): Observable<Uf> {
    return this.http.post<Uf>(this.apiUrl, uf)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing Brazilian state
   * 
   * @param id The ID of the UF to update
   * @param uf The updated UF data
   * @returns Observable containing the updated UF
   */
  updateUf(id: number, uf: Uf): Observable<Uf> {
    return this.http.put<Uf>(`${this.apiUrl}/${id}`, uf)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a Brazilian state
   * 
   * @param id The ID of the UF to delete
   * @returns Observable for the delete operation
   */
  deleteUf(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('UF Service Error:', error);
    throw error;
  }
}