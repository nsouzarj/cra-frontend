import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Solicitacao } from '../../../shared/models/solicitacao.model';
import { DateFormatService } from '../../../shared/services/date-format.service';

@Component({
  selector: 'app-request-detail',
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.scss']
})
export class RequestDetailComponent implements OnInit, OnDestroy {
  solicitacao: Solicitacao | null = null;
  loading = true;

  private themeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitacaoService: SolicitacaoService,
    public permissionService: PermissionService,
    private snackBar: MatSnackBar,
    private dateFormatService: DateFormatService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const requestId = +params['id'];
      if (requestId) {
        this.loadRequest(requestId);
      }
    });
    
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  setupThemeListener(): void {
    // Listen for theme changes to trigger change detection
    this.themeSubscription = new Subscription();
    const themeHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Force change detection when theme changes
      // This will cause the component to re-render with the new theme styles
    };
    
    window.addEventListener('themeChanged', themeHandler);
    // Clean up the event listener when component is destroyed
    this.themeSubscription.add(() => {
      window.removeEventListener('themeChanged', themeHandler);
    });
  }

  private loadRequest(requestId: number): void {
    this.solicitacaoService.getSolicitacaoById(requestId).subscribe({
      next: (solicitacao) => {
        this.solicitacao = solicitacao;
        this.loading = false;
        console.log('=== End of loadRequest ===');
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
    return status || 'Pendente';
  }

  getProcessStatusText(status: string | undefined): string {
    return status || 'Não informado';
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pendente';
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  formatDate(date: Date | string | undefined): string {
    return this.dateFormatService.formatDate(date);
  }

  // Helper method to check if the solicitation is of type Audiência
  isAudiencia(): boolean {
    if (!this.solicitacao?.tipoSolicitacao) {
      return false;
    }
    
    const especie = this.solicitacao.tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = this.solicitacao.tipoSolicitacao.tipo?.toLowerCase() || '';
    
    return especie.includes('audiencia') || especie.includes('audiência') || 
           tipo.includes('audiencia') || tipo.includes('audiência');
  }

  // Helper method to check if the solicitation is of type Diligência
  isDiligencia(): boolean {
    if (!this.solicitacao?.tipoSolicitacao) {
      return false;
    }
    
    const especie = this.solicitacao.tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = this.solicitacao.tipoSolicitacao.tipo?.toLowerCase() || '';
    
    return especie.includes('diligencia') || especie.includes('diligência') || 
           tipo.includes('diligencia') || tipo.includes('diligência');
  }
}