import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators'; // Adicionando tap e map
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../shared/models/api-response.model'; // Add this import

/**
 * Service for managing service requests in the CRA system
 * Provides CRUD operations and request management functionality
 */
@Injectable({
  providedIn: 'root'
})
export class SolicitacaoService {
  private apiUrl = `${environment.apiUrl}/api/solicitacoes`;

  constructor(private http: HttpClient) { 
    console.log('URL da API de solicitações:', this.apiUrl); // Adicionando log para debug
  }

  /**
   * Retrieves all service requests from the system with pagination
   * 
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @param sortBy The field to sort by
   * @param direction The sort direction (ASC or DESC)
   * @returns Observable containing paginated list of service requests
   */
  getSolicitacoesPaginated(page: number = 0, size: number = 20, sortBy: string = 'id', direction: string = 'ASC'): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
      
    return this.http.get<PaginatedResponse<Solicitacao>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves all service requests from the system
   * 
   * @returns Observable containing array of service requests
   */
  getSolicitacoes(): Observable<Solicitacao[]> {
    console.log('Buscando solicitações na URL:', this.apiUrl); // Adicionando log para debug
    return this.http.get<PaginatedResponse<Solicitacao>>(this.apiUrl)
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log('Raw data received for all solicitacoes:', response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn('getSolicitacoes did not return expected paginated response:', response);
            return [];
          }
        }),
        // Adicionando log para debug
        tap((solicitacoes) => {
          // Fixed: Added validation to ensure solicitacoes is an array before accessing length
          if (Array.isArray(solicitacoes)) {
            console.log('Dados das solicitações recebidos do backend:', JSON.stringify(solicitacoes));
            console.log('Quantidade de solicitações recebidas:', solicitacoes.length);
          } else {
            console.warn('solicitacoes is not an array:', solicitacoes);
          }
        })
      );
  }

  /**
   * Retrieves a specific service request by ID
   * 
   * @param id The ID of the service request to retrieve
   * @returns Observable containing the requested service request
   */
  getSolicitacaoById(id: number): Observable<Solicitacao> {
    console.log('Buscando solicitação por ID:', id); // Adicionando log para debug
    return this.http.get<Solicitacao>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Creates a new service request in the system
   * 
   * @param solicitacao The service request object to create
   * @returns Observable containing the created service request
   */
  createSolicitacao(solicitacao: Solicitacao): Observable<Solicitacao> {
    console.log(solicitacao);
    return this.http.post<Solicitacao>(this.apiUrl, solicitacao)
      .pipe(catchError(this.handleError));
  }

  /**
   * Updates an existing service request
   * 
   * @param id The ID of the service request to update
   * @param solicitacao The updated service request data
   * @returns Observable containing the updated service request
   */
  updateSolicitacao(id: number, solicitacao: Solicitacao): Observable<Solicitacao> {
        console.log(solicitacao);
    return this.http.put<Solicitacao>(`${this.apiUrl}/${id}`, solicitacao)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a service request from the system
   * 
   * @param id The ID of the service request to delete
   * @returns Observable for the delete operation
   */
  deleteSolicitacao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by status
   * 
   * @param status The service request status to search for
   * @returns Observable containing array of matching service requests
   */
  searchByStatus(status: string): Observable<Solicitacao[]> {
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/status/${status}`)
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for status ${status}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn(`searchByStatus(${status}) did not return expected paginated response:`, response);
            return [];
          }
        })
      );
  }

  /**
   * Searches for service requests by status with pagination
   * 
   * @param status The service request status to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByStatusPaginated(status: string, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/status/${status}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by correspondent
   * 
   * @param correspondenteId The correspondent ID to search for
   * @returns Observable containing array of matching service requests
   */
  searchByCorrespondente(correspondenteId: number): Observable<Solicitacao[]> {
    console.log(`Fetching solicitacoes for correspondent ID: ${correspondenteId}`);
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/correspondente/${correspondenteId}`)
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for correspondent ${correspondenteId}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn('searchByCorrespondente did not return expected paginated response:', response);
            return [];
          }
        })
      );
  }

  /**
   * Searches for service requests by correspondent with pagination
   * 
   * @param correspondenteId The correspondent ID to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByCorrespondentePaginated(correspondenteId: number, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/correspondente/${correspondenteId}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by user's correspondent
   * 
   * @param usuarioId The user ID to search for correspondent requests
   * @returns Observable containing array of matching service requests
   */
  searchByUserCorrespondente(usuarioId: number): Observable<Solicitacao[]> {
    console.log(`Fetching solicitacoes for user ID: ${usuarioId}`);
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/usuario/${usuarioId}/correspondente`)
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for user ${usuarioId}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn('searchByUserCorrespondente did not return expected paginated response:', response);
            return [];
          }
        })
      );
  }

  /**
   * Searches for service requests by user's correspondent with pagination
   * 
   * @param usuarioId The user ID to search for correspondent requests
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByUserCorrespondentePaginated(usuarioId: number, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/usuario/${usuarioId}/correspondente`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by process
   * 
   * @param processoId The process ID to search for
   * @returns Observable containing array of matching service requests
   */
  searchByProcesso(processoId: number): Observable<Solicitacao[]> {
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/processo/${processoId}`)
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for processo ${processoId}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn(`searchByProcesso(${processoId}) did not return expected paginated response:`, response);
            return [];
          }
        })
      );
  }

  /**
   * Searches for service requests by process with pagination
   * 
   * @param processoId The process ID to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByProcessoPaginated(processoId: number, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/processo/${processoId}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by type
   * 
   * @param tipo The service request type to search for
   * @returns Observable containing array of matching service requests
   */
  searchByTipo(tipo: string): Observable<Solicitacao[]> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/tipo`, { params })
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for tipo ${tipo}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn(`searchByTipo(${tipo}) did not return expected paginated response:`, response);
            return [];
          }
        })
      );
  }

  /**
   * Searches for service requests by type with pagination
   * 
   * @param tipo The service request type to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByTipoPaginated(tipo: string, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('tipo', tipo)
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/tipo`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by deadline period
   * 
   * @param dataInicio The start date for the deadline period
   * @param dataFim The end date for the deadline period
   * @returns Observable containing array of matching service requests
   */
  searchByPrazo(dataInicio: string, dataFim: string): Observable<Solicitacao[]> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/prazo`, { params })
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for prazo ${dataInicio} to ${dataFim}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn(`searchByPrazo(${dataInicio}, ${dataFim}) did not return expected paginated response:`, response);
            return [];
          }
        })
      );
  }

  /**
   * Searches for service requests by deadline period with pagination
   * 
   * @param dataInicio The start date for the deadline period
   * @param dataFim The end date for the deadline period
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByPrazoPaginated(dataInicio: string, dataFim: string, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim)
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/prazo`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves service request statistics by status
   * 
   * @param status The service request status to get statistics for
   * @returns Observable containing the count of service requests with the specified status
   */
  getStatusStatistics(status: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/status/${status}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves all pending service requests
   * 
   * @returns Observable containing array of pending service requests
   */
  getPendingRequests(): Observable<Solicitacao[]> {
    // Assuming 'Pendente' is the pending status, this should be updated based on actual status values from backend
    return this.searchByStatus('Pendente');
  }

  /**
   * Retrieves all overdue service requests
   * 
   * @returns Observable containing array of overdue service requests
   */
  getOverdueRequests(): Observable<Solicitacao[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/vencidas?data=${today}`)
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for overdue requests:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn('getOverdueRequests did not return expected paginated response:', response);
            return [];
          }
        })
      );
  }

  /**
   * Retrieves all available service request statuses
   * 
   * @returns Observable containing array of service request statuses
   */
  getSolicitacaoStatuses(): Observable<SolicitacaoStatus[]> {
    return this.http.get<SolicitacaoStatus[]>(`${environment.apiUrl}/api/status-solicitacao`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests with general search term and pagination
   * 
   * @param searchTerm The search term to use
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @param sortBy The field to sort by
   * @param direction The sort direction (ASC or DESC)
   * @returns Observable containing paginated list of matching service requests
   */
  searchSolicitacoesPaginated(searchTerm: string, page: number = 0, size: number = 20, sortBy: string = 'id', direction: string = 'ASC'): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('search', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by comarca with pagination
   * 
   * @param comarcaId The comarca ID to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByComarcaPaginated(comarcaId: number, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/comarca/${comarcaId}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Searches for service requests by comarca
   * 
   * @param comarcaId The comarca ID to search for
   * @returns Observable containing array of matching service requests
   */
  searchByComarca(comarcaId: number): Observable<Solicitacao[]> {
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/comarca/${comarcaId}`)
      .pipe(
        catchError(this.handleError),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for comarca ${comarcaId}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else {
            console.warn(`searchByComarca(${comarcaId}) did not return expected paginated response:`, response);
            return [];
          }
        })
      );
  }

  /**
   * Searches for service requests by comarca and correspondent with pagination
   * 
   * @param comarcaId The comarca ID to search for
   * @param correspondenteId The correspondent ID to search for
   * @param page The page number (0-based)
   * @param size The number of items per page
   * @returns Observable containing paginated list of matching service requests
   */
  searchByComarcaAndCorrespondentePaginated(comarcaId: number, correspondenteId: number, page: number = 0, size: number = 20): Observable<PaginatedResponse<Solicitacao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('comarcaId', comarcaId.toString())
      .set('correspondenteId', correspondenteId.toString());
      
    console.log(`Calling searchByComarcaAndCorrespondentePaginated with comarcaId: ${comarcaId}, correspondenteId: ${correspondenteId}, page: ${page}, size: ${size}`);
    console.log(`URL: ${this.apiUrl}/buscar with params:`, params);
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error calling search endpoint with parameters, trying alternative endpoint:', error);
          // Fallback to the path-based approach
          const fallbackParams = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
          return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/comarca/${comarcaId}/correspondente/${correspondenteId}`, { params: fallbackParams });
        }),
        map((response: PaginatedResponse<Solicitacao>) => {
          // Ensure response has the correct structure
          if (response && !response.content) {
            response.content = [];
          }
          return response;
        })
      );
  }

  /**
   * Searches for service requests by comarca and correspondent
   * 
   * @param comarcaId The comarca ID to search for
   * @param correspondenteId The correspondent ID to search for
   * @returns Observable containing array of matching service requests
   */
  searchByComarcaAndCorrespondente(comarcaId: number, correspondenteId: number): Observable<Solicitacao[]> {
    console.log(`Calling searchByComarcaAndCorrespondente with comarcaId: ${comarcaId}, correspondenteId: ${correspondenteId}`);
    const params = new HttpParams()
      .set('comarcaId', comarcaId.toString())
      .set('correspondenteId', correspondenteId.toString());
      
    console.log(`URL: ${this.apiUrl}/buscar with params:`, params);
    return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error calling search endpoint with parameters, trying alternative endpoint:', error);
          // Fallback to the path-based approach
          return this.http.get<PaginatedResponse<Solicitacao>>(`${this.apiUrl}/buscar/comarca/${comarcaId}/correspondente/${correspondenteId}`);
        }),
        // Extract the content array from the paginated response
        map((response: PaginatedResponse<Solicitacao>) => {
          console.log(`Raw data received for comarca ${comarcaId} and correspondent ${correspondenteId}:`, response);
          if (response && Array.isArray(response.content)) {
            console.log(`Returning ${response.content.length} solicitacoes from page ${response.number}`);
            return response.content;
          } else if (Array.isArray(response)) {
            // Handle case where backend returns array directly instead of paginated response
            console.log(`Backend returned array directly with ${response.length} solicitacoes`);
            return response;
          } else {
            console.warn(`searchByComarcaAndCorrespondente(${comarcaId}, ${correspondenteId}) did not return expected paginated response:`, response);
            return [];
          }
        })
      );
  }

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('Solicitacao Service Error:', error);
    throw error;
  }
}