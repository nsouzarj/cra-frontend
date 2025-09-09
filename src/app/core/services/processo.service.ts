import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Processo, Orgao } from '../../shared/models/processo.model';
import { Comarca } from '../../shared/models/comarca.model';
import { ComarcaService } from './comarca.service';
import { environment } from '../../../environments/environment';

/**
 * Service for managing legal processes in the CRA system
 * Provides CRUD operations and process management functionality
 */
@Injectable({
  providedIn: 'root'
})
export class ProcessoService {
  private apiUrl = `${environment.apiUrl}/api/processos`;

  constructor(
    private http: HttpClient,
    private comarcaService: ComarcaService
  ) { }

  /**
   * Retrieves all legal processes from the system
   * 
   * @returns Observable containing array of processes
   */
  getProcessos(): Observable<Processo[]> {
    return this.http.get<Processo[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific legal process by ID
   * 
   * @param id The ID of the process to retrieve
   * @returns Observable containing the requested process
   */
  getProcessoById(id: number): Observable<Processo> {
    return this.http.get<Processo>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new legal process in the system
   * 
   * @param processo The process object to create
   * @returns Observable containing the created process
   */
  createProcesso(processo: Processo): Observable<Processo> {
    return this.http.post<Processo>(this.apiUrl, processo)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing legal process
   * 
   * @param id The ID of the process to update
   * @param processo The updated process data
   * @returns Observable containing the updated process
   */
  updateProcesso(id: number, processo: Processo): Observable<Processo> {
    return this.http.put<Processo>(`${this.apiUrl}/${id}`, processo)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a legal process from the system
   * 
   * @param id The ID of the process to delete
   * @returns Observable for the delete operation
   */
  deleteProcesso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for a process by process number
   * 
   * @param numeroProcesso The process number to search for
   * @returns Observable containing the found process
   */
  searchByNumero(numeroprocesso: string): Observable<Processo> {
    return this.http.get<Processo>(`${this.apiUrl}/buscar/numero/${numeroprocesso}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by process number (for research)
   * 
   * @param numero The process number to search for
   * @returns Observable containing array of matching processes
   */
  searchByNumeroPesquisa(numero: string): Observable<Processo[]> {
    const params = new HttpParams().set('numero', numero);
    return this.http.get<Processo[]>(`${this.apiUrl}/buscar/numero-pesquisa`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by party name
   * 
   * @param parte The party name to search for
   * @returns Observable containing array of matching processes
   */
  searchByParte(parte: string): Observable<Processo[]> {
    const params = new HttpParams().set('parte', parte);
    return this.http.get<Processo[]>(`${this.apiUrl}/buscar/parte`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by opposing party name
   * 
   * @param adverso The opposing party name to search for
   * @returns Observable containing array of matching processes
   */
  searchByAdverso(adverso: string): Observable<Processo[]> {
    const params = new HttpParams().set('adverso', adverso);
    return this.http.get<Processo[]>(`${this.apiUrl}/buscar/adverso`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by status
   * 
   * @param status The process status to search for
   * @returns Observable containing array of matching processes
   */
  searchByStatus(status: string): Observable<Processo[]> {
    return this.http.get<Processo[]>(`${this.apiUrl}/buscar/status/${status}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by subject
   * 
   * @param assunto The subject to search for
   * @returns Observable containing array of matching processes
   */
  searchByAssunto(assunto: string): Observable<Processo[]> {
    const params = new HttpParams().set('assunto', assunto);
    return this.http.get<Processo[]>(`${this.apiUrl}/buscar/assunto`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by court district
   * 
   * @param comarcaId The court district ID to search for
   * @returns Observable containing array of matching processes
   */
  searchByComarca(comarcaId: number): Observable<Processo[]> {
    return this.http.get<Processo[]>(`${this.apiUrl}/buscar/comarca/${comarcaId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by agency
   * 
   * @param orgaoId The agency ID to search for
   * @returns Observable containing array of matching processes
   */
  searchByOrgao(orgaoId: number): Observable<Processo[]> {
    return this.http.get<Processo[]>(`${this.apiUrl}/buscar/orgao/${orgaoId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves process statistics by status
   * 
   * @param status The process status to get statistics for
   * @returns Observable containing the count of processes with the specified status
   */
  getStatusStatistics(status: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/status/${status}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves all process statuses from the backend
   * 
   * @returns Observable containing array of process statuses
   */
  getProcessoStatuses(): Observable<{id: number, status: string}[]> {
    return this.http.get<{id: number, status: string}[]>(`${this.apiUrl}/status`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves all court districts (delegates to ComarcaService)
   * 
   * @returns Observable containing array of court districts
   */
  getComarcas(): Observable<Comarca[]> {
    return this.comarcaService.getComarcas();
  }

  /**
   * Retrieves all agencies
   * 
   * @returns Observable containing array of agencies
   */
  getOrgaos(): Observable<Orgao[]> {
    return this.http.get<Orgao[]>(`${environment.apiUrl}/api/orgaos`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('Processo Service Error:', error);
    throw error;
  }
}