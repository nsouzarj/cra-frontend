import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SolicitacaoAnexo } from '../../shared/models/solicitacao-anexo.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoAnexoService {
  private apiUrl = `${environment.apiUrl}/api/soli-arquivos`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('SolicitacaoAnexoService constructor called');
  }

  
uploadAnexo(file: File, solicitacaoId: number): Observable<HttpEvent<any>> {
  console.log('uploadAnexo called with:', { file, solicitacaoId });
  const formData: FormData = new FormData();
  formData.append('file', file, file.name);
  const userId = this.authService.currentUserValue?.id ?? '';
  formData.append('userId', userId.toString?.() || '');
  formData.append('solicitacaoId', solicitacaoId.toString());
  formData.append("storageLocation", "google_drive")
  // Determine the origin based on user role using AuthService
  let origem = 'usuario'; // default value
  console.log('User roles:', this.authService.currentUserValue?.authorities);
  console.log('Is admin:', this.authService.isAdmin());
  console.log('Is advogado:', this.authService.isAdvogado());
  console.log('Is correspondente:', this.authService.isCorrespondente());
  
  if (this.authService.isAdmin() || this.authService.isAdvogado()) {
    origem = 'solicitante';
  } else if (this.authService.isCorrespondente()) {
    origem = 'correspondente';
  }
  
  console.log('Setting origin to:', origem);

  formData.append('origem', origem);

  const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
    reportProgress: true,
    responseType: 'json'
    // DON'T set Content-Type header - browser will set it automatically with correct boundary
  });

  return this.http.request(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Error uploading file:', error);
      // Handle specific error cases
      if (error.status === 0) {
        // Network error or CORS issue
        return throwError(() => new Error('Connection error. Please check your network connection and CORS configuration.'));
      } else if (error.status === 400) {
        return throwError(() => new Error('Invalid request. Please check the file and parameters.'));
      } else if (error.status === 500) {
        return throwError(() => new Error('Server error. Please try again later.'));
      }
      return throwError(() => error);
    })
  );
}

/**
 * Uploads a file with a specific origin
 * 
 * @param file The file to upload
 * @param solicitacaoId The ID of the service request
 * @param origem The origin of the file (e.g., "solicitante", "correspondente")
 * @returns Observable containing the upload progress and response
 */
uploadAnexoWithOrigin(file: File, solicitacaoId: number, origem: string): Observable<HttpEvent<any>> {
  const formData: FormData = new FormData();
  formData.append('file', file, file.name);
  formData.append('solicitacaoId', solicitacaoId.toString());
  formData.append('origem', origem);

  const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
    reportProgress: true,
    responseType: 'json'
    // DON'T set Content-Type header - browser will set it automatically with correct boundary
  });

  return this.http.request(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Error uploading file:', error);
      // Handle specific error cases
      if (error.status === 0) {
        // Network error or CORS issue
        return throwError(() => new Error('Connection error. Please check your network connection and CORS configuration.'));
      } else if (error.status === 400) {
        return throwError(() => new Error('Invalid request. Please check the file and parameters.'));
      } else if (error.status === 500) {
        return throwError(() => new Error('Server error. Please try again later.'));
      }
      return throwError(() => error);
    })
  );
}

  /**
   * Retrieves all file attachments for a specific service request
   * 
   * @param solicitacaoId The ID of the service request to get attachments for
   * @returns Observable containing array of file attachments
   */
  getAnexosBySolicitacaoId(solicitacaoId: number): Observable<SolicitacaoAnexo[]> {
    console.log('getAnexosBySolicitacaoId called with:', solicitacaoId);
    return this.http.get<SolicitacaoAnexo[]>(`${this.apiUrl}/solicitacao/${solicitacaoId}`).pipe(
      // Transform date strings to Date objects
      map((anexos: SolicitacaoAnexo[]) => {
        console.log('Raw attachments from server:', anexos);
        return anexos.map(anexo => {
          if (anexo.dataInclusao && typeof anexo.dataInclusao === 'string') {
            // Convert string to Date object
            anexo.dataInclusao = new Date(anexo.dataInclusao);
          }
          console.log('Processed attachment:', anexo);
          return anexo;
        });
      })
    );
  }


  downloadAnexo(anexoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${anexoId}/download`, {
      responseType: 'blob'
    });
  }


  deleteAnexo(anexoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${anexoId}`);
  }
}