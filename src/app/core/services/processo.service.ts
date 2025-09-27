import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Processo } from '../../shared/models/processo.model';
import { Comarca } from '../../shared/models/comarca.model';
import { Orgao } from '../../shared/models/orgao.model';
import { environment } from '../../../environments/environment';
import { ComarcaService } from './comarca.service';
import { PaginatedResponse } from '../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProcessoService {
  private apiUrl = `${environment.apiUrl}/api/processos`;

  constructor(private http: HttpClient, private comarcaService: ComarcaService) { }

  /**
   * Retrieves all processes from the system
   * 
   * @returns Observable containing array of processes
   */
  getProcessos(): Observable<Processo[]> {
    return this.http.get<Processo[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves a specific process by ID
   * 
   * @param id The ID of the process to retrieve
   * @returns Observable containing the requested process
   */
  getProcessoById(id: number): Observable<Processo> {
    return this.http.get<Processo>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new process in the system
   * 
   * @param processo The process object to create
   * @returns Observable containing the created process
   */
  createProcesso(processo: Processo): Observable<Processo> {
    return this.http.post<Processo>(this.apiUrl, processo)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing process
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
   * Deletes a process from the system
   * 
   * @param id The ID of the process to delete
   * @returns Observable for the delete operation
   */
  deleteProcesso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves all court districts (delegates to ComarcaService)
   * 
   * @returns Observable containing array of court districts
   */
  getComarcas(): Observable<Comarca[]> {
    // For backward compatibility, we fetch all comarcas (first page with large size)
    return new Observable<Comarca[]>(observer => {
      this.comarcaService.getComarcas(0, 1000, 'nome', 'ASC').subscribe({
        next: (response) => {
          observer.next(response.content);
          observer.complete();
        },
        error: (error) => {
          console.error('ProcessoService - Error loading comarcas:', error);
          observer.error(error);
        }
      });
    });
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
   * Retrieves processes with pagination support
   * 
   * @param page Page number (0-based)
   * @param size Number of items per page
   * @param sortBy Field to sort by
   * @param direction Sort direction (ASC or DESC)
   * @returns Observable containing paginated response
   */
  getProcessosPaginated(page: number, size: number, sortBy: string, direction: string): Observable<PaginatedResponse<Processo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
      
    return this.http.get<PaginatedResponse<Processo>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves processes with advanced filtering and pagination support
   * 
   * @param filtro Object containing filter parameters
   * @param page Page number (0-based)
   * @param size Number of items per page
   * @param sortBy Field to sort by
   * @param direction Sort direction (ASC or DESC)
   * @returns Observable containing paginated response
   */
  getProcessosWithFilter(filtro: any, page: number, size: number, sortBy: string, direction: string): Observable<PaginatedResponse<Processo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    // Add filter parameters to the request
    if (filtro) {
      Object.keys(filtro).forEach(key => {
        if (filtro[key] !== null && filtro[key] !== undefined && filtro[key] !== '') {
          params = params.set(key, filtro[key]);
        }
      });
    }
      
    return this.http.get<PaginatedResponse<Processo>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by search term with pagination
   * 
   * @param searchTerm The term to search for
   * @param page Page number (0-based)
   * @param size Number of items per page
   * @param sortBy Field to sort by
   * @param direction Sort direction (ASC or DESC)
   * @returns Observable containing paginated response
   */
  searchProcessosPaginated(searchTerm: string, page: number, size: number, sortBy: string, direction: string): Observable<PaginatedResponse<Processo>> {
    let params = new HttpParams()
      .set('termo', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
      
    return this.http.get<PaginatedResponse<Processo>>(`${this.apiUrl}/buscar/pesquisar`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by comarca with pagination
   * 
   * @param comarcaId The comarca ID to filter by
   * @param page Page number (0-based)
   * @param size Number of items per page
   * @returns Observable containing paginated response
   */
  searchByComarcaPaginated(comarcaId: number, page: number, size: number): Observable<PaginatedResponse<Processo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Processo>>(`${this.apiUrl}/buscar/comarca/${comarcaId}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by orgao with pagination
   * 
   * @param orgaoId The orgao ID to filter by
   * @param page Page number (0-based)
   * @param size Number of items per page
   * @returns Observable containing paginated response
   */
  searchByOrgaoPaginated(orgaoId: number, page: number, size: number): Observable<PaginatedResponse<Processo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Processo>>(`${this.apiUrl}/buscar/orgao/${orgaoId}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for processes by status with pagination
   * 
   * @param status The status to filter by
   * @param page Page number (0-based)
   * @param size Number of items per page
   * @returns Observable containing paginated response
   */
  searchByStatusPaginated(status: string, page: number, size: number): Observable<PaginatedResponse<Processo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Processo>>(`${this.apiUrl}/buscar/status/${status}`, { params })
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