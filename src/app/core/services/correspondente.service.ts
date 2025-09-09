import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Correspondente } from '../../shared/models/correspondente.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing legal correspondents in the CRA system
 * Provides CRUD operations and correspondent management functionality
 */
@Injectable({
  providedIn: 'root'
})
export class CorrespondenteService {
  private apiUrl = `${environment.apiUrl}/api/correspondentes`;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves all correspondents from the system
   * 
   * @returns Observable containing array of correspondents
   */
  getCorrespondentes(): Observable<Correspondente[]> {
    return this.http.get<Correspondente[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific correspondent by ID
   * 
   * @param id The ID of the correspondent to retrieve
   * @returns Observable containing the requested correspondent
   */
  getCorrespondenteById(id: number): Observable<Correspondente> {
    return this.http.get<Correspondente>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new correspondent in the system
   * 
   * @param correspondente The correspondent object to create
   * @returns Observable containing the created correspondent
   */
  createCorrespondente(correspondente: Correspondente): Observable<Correspondente> {
    return this.http.post<Correspondente>(this.apiUrl, correspondente)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing correspondent
   * 
   * @param id The ID of the correspondent to update
   * @param correspondente The updated correspondent data
   * @returns Observable containing the updated correspondent
   */
  updateCorrespondente(id: number, correspondente: Correspondente): Observable<Correspondente> {
    return this.http.put<Correspondente>(`${this.apiUrl}/${id}`, correspondente)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a correspondent from the system
   * 
   * @param id The ID of the correspondent to delete
   * @returns Observable for the delete operation
   */
  deleteCorrespondente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Activates a correspondent account
   * 
   * @param id The ID of the correspondent to activate
   * @returns Observable containing the activated correspondent
   */
  activateCorrespondente(id: number): Observable<Correspondente> {
    return this.http.patch<Correspondente>(`${this.apiUrl}/${id}/ativar`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Deactivates a correspondent account
   * 
   * @param id The ID of the correspondent to deactivate
   * @returns Observable containing the deactivated correspondent
   */
  deactivateCorrespondente(id: number): Observable<Correspondente> {
    return this.http.patch<Correspondente>(`${this.apiUrl}/${id}/inativar`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves all active correspondents
   * 
   * @returns Observable containing array of active correspondents
   */
  getActiveCorrespondentes(): Observable<Correspondente[]> {
    return this.http.get<Correspondente[]>(`${this.apiUrl}/ativos`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for a correspondent by OAB number
   * 
   * @param oab The OAB number to search for
   * @returns Observable containing the found correspondent
   */
  searchByOab(oab: string): Observable<Correspondente> {
    return this.http.get<Correspondente>(`${this.apiUrl}/buscar/oab/${oab}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for correspondents by type
   * 
   * @param tipo The correspondent type to search for
   * @returns Observable containing array of matching correspondents
   */
  searchByTipo(tipo: string): Observable<Correspondente[]> {
    return this.http.get<Correspondente[]>(`${this.apiUrl}/buscar/tipo/${tipo}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for correspondents by name
   * 
   * @param nome The name to search for
   * @returns Observable containing array of matching correspondents
   */
  searchByNome(nome: string): Observable<Correspondente[]> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<Correspondente[]>(`${this.apiUrl}/buscar/nome`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for a correspondent by CPF/CNPJ
   * 
   * @param cpfCnpj The CPF/CNPJ to search for
   * @returns Observable containing the found correspondent
   */
  searchByCpfCnpj(cpfCnpj: string): Observable<Correspondente> {
    return this.http.get<Correspondente>(`${this.apiUrl}/buscar/cpf-cnpj/${cpfCnpj}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('Correspondente Service Error:', error);
    throw error;
  }
}