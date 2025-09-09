import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing service request statuses in the CRA system
 * Provides CRUD operations and status management functionality
 */
@Injectable({
  providedIn: 'root'
})
export class SolicitacaoStatusService {
  private apiUrl = `${environment.apiUrl}/api/solicitacao-status`;

  constructor(private http: HttpClient) { }

  /**
   * Retrieves all service request statuses from the system
   * 
   * @returns Observable containing array of service request statuses
   */
  getSolicitacaoStatuses(): Observable<SolicitacaoStatus[]> {
    return this.http.get<SolicitacaoStatus[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific service request status by ID
   * 
   * @param id The ID of the service request status to retrieve
   * @returns Observable containing the requested service request status
   */
  getSolicitacaoStatusById(id: number): Observable<SolicitacaoStatus> {
    return this.http.get<SolicitacaoStatus>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new service request status in the system
   * 
   * @param status The service request status object to create
   * @returns Observable containing the created service request status
   */
  createSolicitacaoStatus(status: SolicitacaoStatus): Observable<SolicitacaoStatus> {
    return this.http.post<SolicitacaoStatus>(this.apiUrl, status)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing service request status
   * 
   * @param id The ID of the service request status to update
   * @param status The updated service request status data
   * @returns Observable containing the updated service request status
   */
  updateSolicitacaoStatus(id: number, status: SolicitacaoStatus): Observable<SolicitacaoStatus> {
    return this.http.put<SolicitacaoStatus>(`${this.apiUrl}/${id}`, status)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a service request status from the system
   * 
   * @param id The ID of the service request status to delete
   * @returns Observable for the delete operation
   */
  deleteSolicitacaoStatus(id: number): Observable<void> {
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
    console.error('Solicitacao Status Service Error:', error);
    throw error;
  }
}