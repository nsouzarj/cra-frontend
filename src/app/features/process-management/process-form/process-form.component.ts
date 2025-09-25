import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ProcessoService } from '../../../core/services/processo.service';
import { ComarcaService } from '../../../core/services/comarca.service';
import { OrgaoService } from '../../../core/services/orgao.service';
import { Processo } from '../../../shared/models/processo.model';
import { Comarca } from '../../../shared/models/comarca.model';
import { Orgao } from '../../../shared/models/orgao.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-process-form',
  templateUrl: './process-form.component.html',
  styleUrls: ['./process-form.component.scss']
})
export class ProcessFormComponent implements OnInit, OnDestroy {
  processForm: FormGroup;
  loading = false;
  isEditMode = false;
  processId: number | null = null;
  orgaos: Orgao[] = [];
  comarcas: Comarca[] = [];
  filteredComarcas: Comarca[] = [];

  private themeSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private processoService: ProcessoService,
    private comarcaService: ComarcaService,
    private orgaoService: OrgaoService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.processForm = this.formBuilder.group({
      numeroprocesso: ['', [Validators.required]],
      parte: [''],
      adverso: [''],
      cartorio: [''],
      localizacao: [''],
      assunto: [''],
      proceletronico: [''],
      status: ['EM_ANDAMENTO'],
      observacoes: [''],
      ativo: [true],
      orgao: [null],
      comarca: [null]
    });
  }

  ngOnInit(): void {
    this.loadOrgaos();
    this.loadComarcas();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.processId = +params['id'];
        this.loadProcess();
      }
    });

    // Subscribe to orgao changes to filter comarcas
    this.processForm.get('orgao')?.valueChanges.subscribe(orgaoId => {
      this.filterComarcasByOrgao(orgaoId);
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

  loadOrgaos(): void {
    this.orgaoService.getOrgaos().subscribe({
      next: (orgaos) => {
        this.orgaos = orgaos;
      },
      error: (error) => {
        console.error('Error loading orgaos:', error);
        this.snackBar.open('Erro ao carregar órgãos', 'Fechar', { duration: 5000 });
      }
    });
  }

  loadComarcas(): void {
    // For form components, we load all comarcas (first page with large size)
    this.comarcaService.getComarcas(0, 1000, 'nome', 'ASC').subscribe({
      next: (response) => {
        this.comarcas = response.content;
        this.filteredComarcas = response.content;
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
        this.snackBar.open('Erro ao carregar comarcas', 'Fechar', { duration: 5000 });
      }
    });
  }

  filterComarcasByOrgao(orgaoId: number): void {
    if (!orgaoId) {
      this.filteredComarcas = this.comarcas;
      return;
    }

    // In a real implementation, you would filter comarcas based on the selected orgao
    // For now, we'll just show all comarcas
    this.filteredComarcas = this.comarcas;
  }

  loadProcess(): void {
    if (!this.processId) return;
    
    this.processoService.getProcessoById(this.processId).subscribe({
      next: (processo) => {
        this.processForm.patchValue({
          numeroprocesso: processo.numeroprocesso,
          parte: processo.parte,
          adverso: processo.adverso,
          cartorio: processo.cartorio,
          localizacao: processo.localizacao,
          assunto: processo.assunto,
          proceletronico: processo.proceletronico,
          status: processo.status,
          observacoes: processo.observacao,
          ativo: processo.ativo,
          orgao: processo.orgao?.id || null,
          comarca: processo.comarca?.id || null
        });
      },
      error: (error) => {
        this.snackBar.open('Erro ao carregar processo', 'Fechar', { duration: 5000 });
        this.router.navigate(['/processos']);
      }
    });
  }

  onSubmit(): void {
    if (this.processForm.invalid) return;

    // Show confirmation dialog
    const action = this.isEditMode ? 'atualizar' : 'criar';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar operação',
        message: `Tem certeza que deseja ${action} este processo?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.proceedWithSave();
      }
    });
  }

  private proceedWithSave(): void {
    this.loading = true;
    
    // Prepare the processo data with proper orgao and comarca objects
    const formValue = this.processForm.value;
    const orgao = this.orgaos.find(o => o.id === formValue.orgao) || null;
    const comarca = this.comarcas.find(c => c.id === formValue.comarca) || null;
    
    const processData: any = {
      numeroprocesso: formValue.numeroprocesso,
      parte: formValue.parte,
      adverso: formValue.adverso,
      cartorio: formValue.cartorio,
      localizacao: formValue.localizacao,
      assunto: formValue.assunto,
      proceletronico: formValue.proceletronico,
      status: formValue.status,
      observacao: formValue.observacoes,
      ativo: formValue.ativo,
      orgao: orgao,
      comarca: comarca
    };

    const operation = this.isEditMode && this.processId ? 
      this.processoService.updateProcesso(this.processId, processData) : 
      this.processoService.createProcesso(processData);

    operation.subscribe({
      next: (processo) => {
        this.loading = false;
        const message = this.isEditMode ? 'Processo atualizado com sucesso!' : 'Processo criado com sucesso!';
        this.snackBar.open(message, 'Fechar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        // Navigate to process detail page instead of list
        this.router.navigate(['/processos', processo.id]);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Erro ao salvar processo', 'Fechar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/processos']);
  }
}