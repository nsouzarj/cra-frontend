import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TipoSolicitacao } from '../../shared/models/tiposolicitacao.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing request types (tiposolicitacao) in the CRA system
 * Provides CRUD operations and request type management functionality
 */
@Injectable({
  providedIn: 'root'
})
export class TipoSolicitacaoService {
  private apiUrl = `${environment.apiUrl}/api/tipos-solicitacao`;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves all request types from the system
   * 
   * @returns Observable containing array of request types
   */
  getTiposSolicitacao(): Observable<TipoSolicitacao[]> {
    return this.http.get<TipoSolicitacao[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific request type by ID
   * 
   * @param id The ID of the request type to retrieve
   * @returns Observable containing the requested request type
   */
  getTipoSolicitacaoById(id: number): Observable<TipoSolicitacao> {
    return this.http.get<TipoSolicitacao>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new request type in the system
   * 
   * @param tipoSolicitacao The request type object to create
   * @returns Observable containing the created request type
   */
  createTipoSolicitacao(tipoSolicitacao: TipoSolicitacao): Observable<TipoSolicitacao> {
    return this.http.post<TipoSolicitacao>(this.apiUrl, tipoSolicitacao)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing request type
   * 
   * @param id The ID of the request type to update
   * @param tipoSolicitacao The updated request type data
   * @returns Observable containing the updated request type
   */
  updateTipoSolicitacao(id: number, tipoSolicitacao: TipoSolicitacao): Observable<TipoSolicitacao> {
    return this.http.put<TipoSolicitacao>(`${this.apiUrl}/${id}`, tipoSolicitacao)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a request type from the system
   * 
   * @param id The ID of the request type to delete
   * @returns Observable for the delete operation
   */
  deleteTipoSolicitacao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for request types by species
   * 
   * @param especie The species to search for
   * @returns Observable containing array of matching request types
   */
  searchByEspecie(especie: string): Observable<TipoSolicitacao[]> {
    const params = new HttpParams().set('especie', especie);
    return this.http.get<TipoSolicitacao[]>(`${this.apiUrl}/buscar/especie`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for request types by description
   * 
   * @param descricao The description to search for
   * @returns Observable containing array of matching request types
   */
  searchByDescricao(descricao: string): Observable<TipoSolicitacao[]> {
    const params = new HttpParams().set('descricao', descricao);
    return this.http.get<TipoSolicitacao[]>(`${this.apiUrl}/buscar/descricao`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for request types by type
   * 
   * @param tipo The type to search for
   * @returns Observable containing array of matching request types
   */
  searchByTipo(tipo: string): Observable<TipoSolicitacao[]> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<TipoSolicitacao[]>(`${this.apiUrl}/buscar/tipo`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('TipoSolicitacao Service Error:', error);
    throw error;
  }
}