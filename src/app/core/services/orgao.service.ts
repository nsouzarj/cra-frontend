import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Orgao } from '../../shared/models/orgao.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing legal agencies (orgaos) in the CRA system
 * Provides CRUD operations and agency management functionality
 */
@Injectable({
  providedIn: 'root'
})
export class OrgaoService {
  private apiUrl = `${environment.apiUrl}/api/orgaos`;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves all agencies from the system
   * 
   * @returns Observable containing array of agencies
   */
  getOrgaos(): Observable<Orgao[]> {
    return this.http.get<Orgao[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific agency by ID
   * 
   * @param id The ID of the agency to retrieve
   * @returns Observable containing the requested agency
   */
  getOrgaoById(id: number): Observable<Orgao> {
    return this.http.get<Orgao>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new agency in the system
   * 
   * @param orgao The agency object to create
   * @returns Observable containing the created agency
   */
  createOrgao(orgao: Orgao): Observable<Orgao> {
    return this.http.post<Orgao>(this.apiUrl, orgao)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing agency
   * 
   * @param id The ID of the agency to update
   * @param orgao The updated agency data
   * @returns Observable containing the updated agency
   */
  updateOrgao(id: number, orgao: Orgao): Observable<Orgao> {
    return this.http.put<Orgao>(`${this.apiUrl}/${id}`, orgao)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes an agency from the system
   * 
   * @param id The ID of the agency to delete
   * @returns Observable for the delete operation
   */
  deleteOrgao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for agencies by name
   * 
   * @param nome The name to search for
   * @returns Observable containing array of matching agencies
   */
  searchByName(nome: string): Observable<Orgao[]> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<Orgao[]>(`${this.apiUrl}/buscar/nome`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('Orgao Service Error:', error);
    throw error;
  }
}