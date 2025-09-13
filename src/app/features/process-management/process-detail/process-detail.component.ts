import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProcessoService } from '../../../core/services/processo.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Processo } from '../../../shared/models/processo.model';
import { DateFormatService } from '../../../shared/services/date-format.service';

@Component({
  selector: 'app-process-detail',
  templateUrl: './process-detail.component.html',
  styleUrls: ['./process-detail.component.scss']
})
export class ProcessDetailComponent implements OnInit, OnDestroy {
  processo: Processo | null = null;
  loading = true;

  private themeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processoService: ProcessoService,
    public permissionService: PermissionService,
    private dateFormatService: DateFormatService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const processId = +params['id'];
      if (processId) {
        this.loadProcess(processId);
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

  loadProcess(processId: number): void {
    this.processoService.getProcessoById(processId).subscribe({
      next: (processo) => {
        this.processo = processo;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.goBack();
      }
    });
  }

  editProcess(): void {
    if (this.processo?.id) {
      this.router.navigate(['/processos/editar', this.processo.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/processos']);
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'status-em-andamento';
      case 'SUSPENSO':
        return 'status-suspenso';
      case 'ARQUIVADO':
        return 'status-arquivado';
      case 'FINALIZADO':
        return 'status-finalizado';
      default:
        return 'status-default';
    }
  }

  formatDate(date: Date | string | undefined): string {
    return this.dateFormatService.formatDate(date);
  }
}