import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../../core/services/solicitacao-status.service';
import { ProcessoService } from '../../../core/services/processo.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { ComarcaService } from '../../../core/services/comarca.service';
import { UserService } from '../../../core/services/user.service';
import { TipoSolicitacaoService } from '../../../core/services/tiposolicitacao.service';
import { Solicitacao, SolicitacaoStatus } from '../../../shared/models/solicitacao.model';
import { Processo } from '../../../shared/models/processo.model';
import { Correspondente } from '../../../shared/models/correspondente.model';
import { Comarca } from '../../../shared/models/comarca.model';
import { User } from '../../../shared/models/user.model';
import { TipoSolicitacao } from '../../../shared/models/tiposolicitacao.model';

@Component({
  selector: 'app-request-form',
  templateUrl: './request-form.component.html',
  styleUrls: ['./request-form.component.scss']
})
export class RequestFormComponent implements OnInit {
  requestForm: FormGroup;
  isEditMode = false;
  requestId: number | null = null;
  loading = false;
  
  // Dropdown options
  processos: Processo[] = [];
  correspondentes: Correspondente[] = [];
  comarcas: Comarca[] = [];
  usuarios: User[] = [];
  tiposSolicitacao: TipoSolicitacao[] = [];
  statuses: SolicitacaoStatus[] = [];
  
  // Filtered dropdown options (only active processes and correspondentes)
  filteredProcessos: Processo[] = [];
  filteredCorrespondentes: Correspondente[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private solicitacaoService: SolicitacaoService,
    private solicitacaoStatusService: SolicitacaoStatusService,
    private processoService: ProcessoService,
    private correspondenteService: CorrespondenteService,
    private comarcaService: ComarcaService,
    private userService: UserService,
    private tipoSolicitacaoService: TipoSolicitacaoService
  ) {
    this.requestForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadDropdownData();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.requestId = +params['id'];
        this.loadRequest();
      }
    });
  }

  private createForm(): FormGroup {
    // Set default status to the first available status or 'PENDENTE' if none available
    const defaultStatus = this.statuses && this.statuses.length > 0 ? this.statuses[0].status : 'PENDENTE';
    
    return this.formBuilder.group({
      complemento: ['', [Validators.required]],
      tipoSolicitacao: [null],
      status: [defaultStatus],
      processo: [null],
      correspondente: [null],
      comarca: [null],
      usuario: [null],
      dataPrazo: [''],
      observacao: [''],
      instrucoes: ['']
    });
  }

  private loadDropdownData(): void {
    // Load processos
    this.processoService.getProcessos().subscribe({
      next: (processos) => {
        this.processos = processos;
        // Filter to only show processes with status "EM_ANDAMENTO"
        this.filteredProcessos = processos.filter(p => p.status === 'EM_ANDAMENTO');
      },
      error: (error) => {
        console.error('Error loading processos:', error);
        this.snackBar.open('Erro ao carregar processos', 'Fechar', { duration: 5000 });
      }
    });

    // Load correspondentes
    this.correspondenteService.getCorrespondentes().subscribe({
      next: (correspondentes) => {
        this.correspondentes = correspondentes;
        // Filter to only show active correspondentes
        this.filteredCorrespondentes = correspondentes.filter(c => c.ativo === true);
      },
      error: (error) => {
        console.error('Error loading correspondentes:', error);
        this.snackBar.open('Erro ao carregar correspondentes', 'Fechar', { duration: 5000 });
      }
    });

    // Load comarcas
    this.comarcaService.getComarcas().subscribe({
      next: (comarcas) => {
        this.comarcas = comarcas;
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
        this.snackBar.open('Erro ao carregar comarcas', 'Fechar', { duration: 5000 });
      }
    });

    // Load usuarios
    this.userService.getUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: (error) => {
        console.error('Error loading usuarios:', error);
        this.snackBar.open('Erro ao carregar usuários', 'Fechar', { duration: 5000 });
      }
    });

    // Load tipos de solicitacao
    this.tipoSolicitacaoService.getTiposSolicitacao().subscribe({
      next: (tipos) => {
        this.tiposSolicitacao = tipos;
      },
      error: (error) => {
        console.error('Error loading tipos de solicitacao:', error);
        this.snackBar.open('Erro ao carregar tipos de solicitação', 'Fechar', { duration: 5000 });
      }
    });

    // Load statuses
    this.solicitacaoStatusService.getSolicitacaoStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.snackBar.open('Erro ao carregar status', 'Fechar', { duration: 5000 });
      }
    });
  }

  private loadRequest(): void {
    if (!this.requestId) return;
    
    this.loading = true;
    this.solicitacaoService.getSolicitacaoById(this.requestId).subscribe({
      next: (solicitacao) => {
        this.requestForm.patchValue({
          complemento: solicitacao.complemento || '',
          tipoSolicitacao: solicitacao.tipoSolicitacao?.idtiposolicitacao || null,
          status: solicitacao.statusSolicitacao?.idstatus || (this.statuses && this.statuses.length > 0 ? this.statuses[0].status : 'PENDENTE'),
          processo: solicitacao.processo?.id || null,
          correspondente: solicitacao.correspondente?.id || null,
          comarca: solicitacao.comarca?.id || null,
          usuario: solicitacao.usuario?.id || null,
          dataPrazo: solicitacao.dataPrazo || '',
          observacao: solicitacao.observacao || '',
          instrucoes: solicitacao.instrucoes || ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading solicitacao:', error);
        this.snackBar.open('Erro ao carregar solicitação', 'Fechar', { duration: 5000 });
        this.loading = false;
        this.router.navigate(['/solicitacoes']);
      }
    });
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    
    // Prepare the solicitacao object
    const formValue = this.requestForm.value;
    
    // Find the selected status object
    const selectedStatus = this.statuses.find(s => s.status === formValue.status);
    
    const solicitacao: any = {
      complemento: formValue.complemento,
      dataPrazo: formValue.dataPrazo || null,
      observacao: formValue.observacao || null,
      instrucoes: formValue.instrucoes || null,
      ativo: true
    };

    // Add relationships if selected
    if(formValue.status){
      solicitacao.statusSolicitacao = { idstatus: formValue.status };
    }

    if (formValue.tipoSolicitacao) {
      solicitacao.tipoSolicitacao = { idtiposolicitacao: formValue.tipoSolicitacao };
    }
    
    if (formValue.processo) {
      solicitacao.processo = { id: formValue.processo };
    }
    
    if (formValue.correspondente) {
      solicitacao.correspondente = { id: formValue.correspondente };
    }
    
    if (formValue.comarca) {
      solicitacao.comarca = { id: formValue.comarca };
    }
    
    if (formValue.usuario) {
      solicitacao.usuario = { id: formValue.usuario };
    }

    // Determine if we're creating or updating
    const operation = this.isEditMode && this.requestId
      ? this.solicitacaoService.updateSolicitacao(this.requestId, solicitacao)
      : this.solicitacaoService.createSolicitacao(solicitacao);

    operation.subscribe({
      next: (result) => {
        this.loading = false;
        const message = this.isEditMode 
          ? 'Solicitação atualizada com sucesso!' 
          : 'Solicitação criada com sucesso!';
        this.snackBar.open(message, 'Fechar', { duration: 3000 });
        this.router.navigate(['/solicitacoes']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving solicitacao:', error);
        const message = this.isEditMode
          ? 'Erro ao atualizar solicitação'
          : 'Erro ao criar solicitação';
        this.snackBar.open(message, 'Fechar', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/solicitacoes']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.requestForm.controls).forEach(key => {
      const control = this.requestForm.get(key);
      control?.markAsTouched();
    });
  }
}