import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessoService } from '../../../core/services/processo.service';
import { AuthService } from '../../../core/services/auth.service'; // Added AuthService
import { PermissionService } from '../../../core/services/permission.service'; // Added PermissionService
import { Processo } from '../../../shared/models/processo.model';

@Component({
  selector: 'app-process-detail',
  templateUrl: './process-detail.component.html',
  styleUrls: ['./process-detail.component.scss']
})
export class ProcessDetailComponent implements OnInit {
  processo: Processo | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processoService: ProcessoService,
    public permissionService: PermissionService // Added PermissionService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const processId = +params['id'];
      if (processId) {
        this.loadProcess(processId);
      }
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
}