import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { ComarcaService } from '../../../core/services/comarca.service';
import { UfService } from '../../../core/services/uf.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Comarca } from '../../../shared/models/comarca.model';
import { Uf } from '../../../shared/models/uf.model';

@Component({
  selector: 'app-comarca-form',
  templateUrl: './comarca-form.component.html',
  styleUrls: ['./comarca-form.component.scss']
})
export class ComarcaFormComponent implements OnInit {
  comarcaForm: FormGroup;
  loading = false;
  isEditMode = false;
  comarcaId: number | null = null;
  ufs: Uf[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private comarcaService: ComarcaService,
    private ufService: UfService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.comarcaForm = this.createComarcaForm();
  }

  ngOnInit(): void {
    // Check if user has admin role
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    // Load UFs for selection
    this.loadUfs();

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.comarcaId = +params['id'];
        this.loadComarca();
      }
    });
  }

  createComarcaForm(): FormGroup {
    return this.formBuilder.group({
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      uf: [null, [Validators.required]],
      ativo: [true]
    });
  }

  loadUfs(): void {
    this.ufService.getUfs().subscribe({
      next: (ufs) => {
        this.ufs = ufs;
      },
      error: (error) => {
        console.error('Error loading UFs:', error);
        this.snackBar.open('Erro ao carregar estados', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadComarca(): void {
    if (!this.comarcaId) return;

    this.comarcaService.getComarcaById(this.comarcaId).subscribe({
      next: (comarca) => {
        // Populate form
        this.comarcaForm.patchValue({
          nome: comarca.nome,
          uf: comarca.uf.id,
          ativo: comarca.ativo
        });
      },
      error: (error) => {
        console.error('Error loading comarca:', error);
        this.snackBar.open('Erro ao carregar comarca', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/comarcas']);
      }
    });
  }

  onSubmit(): void {
    if (this.comarcaForm.invalid) {
      this.markFormGroupTouched(this.comarcaForm);
      return;
    }

    // Show confirmation dialog when editing a comarca
    if (this.isEditMode) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Confirmar Alterações',
          message: 'Tem certeza que deseja salvar as alterações desta comarca?',
          confirmText: 'Salvar',
          cancelText: 'Cancelar'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.saveComarca();
        }
      });
    } else {
      // For create mode, save directly without confirmation
      this.saveComarca();
    }
  }

  private saveComarca(): void {
    this.loading = true;
    
    // Prepare comarca data
    const formValue = this.comarcaForm.value;
    const comarcaData: any = {
      nome: formValue.nome,
      uf: { id: formValue.uf },
      ativo: formValue.ativo
    };

    const operation = this.isEditMode && this.comarcaId ? 
      this.comarcaService.updateComarca(this.comarcaId, comarcaData) : 
      this.comarcaService.createComarca(comarcaData);

    operation.subscribe({
      next: (comarca) => {
        this.loading = false;
        const message = this.isEditMode ? 'Comarca atualizada com sucesso!' : 'Comarca criada com sucesso!';
        this.snackBar.open(message, 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/comarcas']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving comarca:', error);
        
        let message = 'Erro ao salvar comarca.';
        if (error.status === 400) {
          message = 'Dados inválidos ou comarca já existe.';
        }
        
        this.snackBar.open(message, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/comarcas']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}