import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {

  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retry(1), // Retry failed requests once
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Ocorreu um erro inesperado';
    let showSnackbar = true;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Erro de conexão. Verifique sua conexão com a internet.';
          break;
        case 400:
          errorMessage = this.extractServerMessage(error) || 'Dados inválidos enviados.';
          break;
        case 401:
          errorMessage = 'Sessão expirada. Faça login novamente.';
          this.router.navigate(['/login']);
          break;
        case 403:
          errorMessage = 'Você não tem permissão para realizar esta ação.';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado.';
          break;
        case 409:
          errorMessage = this.extractServerMessage(error) || 'Conflito de dados.';
          break;
        case 422:
          errorMessage = this.extractServerMessage(error) || 'Dados não processáveis.';
          break;
        case 429:
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = `Erro ${error.status}: ${error.statusText}`;
      }
    }

    // Show error message to user
    if (showSnackbar && error.status !== 401) {
      this.snackBar.open(errorMessage, 'Fechar', {
        duration: 8000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }

    // Log error for debugging
    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      url: error.url,
      error: error.error
    });
  }

  private extractServerMessage(error: HttpErrorResponse): string | null {
    if (error.error && typeof error.error === 'object') {
      return error.error.message || error.error.error || error.error.detail || null;
    }
    if (typeof error.error === 'string') {
      return error.error;
    }
    return null;
  }
}