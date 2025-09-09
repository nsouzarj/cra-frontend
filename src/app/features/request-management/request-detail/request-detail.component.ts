import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { PermissionService } from '../../../core/services/permission.service'; // Added PermissionService
import { Solicitacao } from '../../../shared/models/solicitacao.model';

@Component({
  selector: 'app-request-detail',
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.scss']
})
export class RequestDetailComponent implements OnInit {
  solicitacao: Solicitacao | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitacaoService: SolicitacaoService,
    public permissionService: PermissionService, // Added PermissionService
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const requestId = +params['id'];
      if (requestId) {
        this.loadRequest(requestId);
      }
    });
  }

  private loadRequest(requestId: number): void {
    this.solicitacaoService.getSolicitacaoById(requestId).subscribe({
      next: (solicitacao) => {
        this.solicitacao = solicitacao;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading solicitacao:', error);
        this.snackBar.open('Erro ao carregar solicitação', 'Fechar', { duration: 5000 });
        this.loading = false;
        this.goBack();
      }
    });
  }

  editRequest(): void {
    if (this.solicitacao?.id) {
      this.router.navigate(['/solicitacoes/editar', this.solicitacao.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/solicitacoes']);
  }

  getStatusText(status: string | undefined): string {
    // Since we're now using dynamic statuses from endpoints, we'll just return the status value
    // In a real implementation, you might want to map these to user-friendly labels
    return status || 'Pendente';
  }

  getProcessStatusText(status: string | undefined): string {
    // Since we're now using dynamic statuses from endpoints, we'll just return the status value
    // In a real implementation, you might want to map these to user-friendly labels
    return status || 'Não informado';
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pendente';
    // Convert status to a CSS class-friendly format
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }
}