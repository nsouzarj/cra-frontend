import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Comarca } from '../../shared/models/comarca.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComarcaService {
  private apiUrl = `${environment.apiUrl}/api/comarcas`;

  constructor(private http: HttpClient) { }

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
   * Lists all court districts ordered by name.
   * 
   * @returns List of all court districts ordered by name
   */
  getComarcas(): Observable<Comarca[]> {
    return this.http.get<Comarca[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a court district by ID.
   * 
   * @param id The ID of the court district to retrieve
   * @returns The court district if found
   */
  getComarcaById(id: number): Observable<Comarca> {
    return this.http.get<Comarca>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches court districts by name (partial match).
   * 
   * @param nome The name to search for
   * @returns List of matching court districts
   */
  searchByName(nome: string): Observable<Comarca[]> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<Comarca[]>(`${this.apiUrl}/buscar/nome`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Finds court districts by state (UF) ID.
   * 
   * @param ufId The state ID to search for
   * @returns List of court districts in the specified state
   */
  getByUfId(ufId: number): Observable<Comarca[]> {
    return this.http.get<Comarca[]>(`${this.apiUrl}/buscar/uf/${ufId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Finds court districts by state abbreviation (sigla).
   * 
   * @param sigla The state abbreviation to search for
   * @returns List of court districts in the specified state
   */
  getByUfSigla(sigla: string): Observable<Comarca[]> {
    return this.http.get<Comarca[]>(`${this.apiUrl}/buscar/uf/sigla/${sigla}`)
      .pipe(catchError(this.handleError));
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
    throw error;
  }
}