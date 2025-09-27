import { Component, OnInit, Output, EventEmitter, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TipoSolicitacaoService } from '../../../core/services/tiposolicitacao.service';
import { ComarcaService } from '../../../core/services/comarca.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { SolicitacaoStatusService } from '../../../core/services/solicitacao-status.service'; // Add this import
import { TipoSolicitacao } from '../../models/tiposolicitacao.model';
import { Comarca } from '../../models/comarca.model';
import { Correspondente } from '../../models/correspondente.model';
import { SolicitacaoStatus } from '../../models/solicitacao.model'; // Add this import
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface RequestFilterCriteria {
  status: string;
  search: string;
  processo: string;
  tipo: string;
  comarca: number | null;
  correspondenteId?: number | null;
  correspondenteText?: string;
  dataSolicitacaoFrom: Date | null;
  dataSolicitacaoTo: Date | null;
  dataPrazoFrom: Date | null;
  dataPrazoTo: Date | null;
}

@Component({
  selector: 'app-request-filter',
  templateUrl: './request-filter.component.html',
  styleUrls: ['./request-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class RequestFilterComponent implements OnInit {
  @Input() showCorrespondentFilter = false;
  @Output() filterChange = new EventEmitter<RequestFilterCriteria>();
  @Output() clearFilters = new EventEmitter<void>();

  filterForm: FormGroup;
  tiposSolicitacao: TipoSolicitacao[] = [];
  comarcas: Comarca[] = [];
  correspondentes: Correspondente[] = [];
  statuses: SolicitacaoStatus[] = []; // Add this property for actual statuses
  
  // Using inject() function instead of constructor injection
  private fb = inject(FormBuilder);
  private tipoSolicitacaoService = inject(TipoSolicitacaoService);
  private comarcaService = inject(ComarcaService);
  private correspondenteService = inject(CorrespondenteService);
  private solicitacaoStatusService = inject(SolicitacaoStatusService); // Add this service

  constructor() {
    this.filterForm = this.fb.group({
      status: [''],
      search: [''],
      processo: [''],
      tipo: [''],
      comarca: [null],
      correspondenteId: [null],
      correspondenteText: [''],
      dataSolicitacaoFrom: [null],
      dataSolicitacaoTo: [null],
      dataPrazoFrom: [null],
      dataPrazoTo: [null]
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();
  }

  private loadFilterOptions(): void {
    // Load tipos de solicitação
    this.tipoSolicitacaoService.getTiposSolicitacao().subscribe({
      next: (tipos) => {
        this.tiposSolicitacao = tipos;
      },
      error: (error) => {
        console.error('Error loading tipos de solicitação:', error);
      }
    });

    // Load comarcas
    this.comarcaService.getAllComarcas().subscribe({
      next: (comarcas) => {
        this.comarcas = comarcas;
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
      }
    });

    // Load correspondentes (only if correspondent filter is shown)
    if (this.showCorrespondentFilter) {
      this.correspondenteService.getCorrespondentes().subscribe({
        next: (correspondentes) => {
          this.correspondentes = correspondentes;
        },
        error: (error) => {
          console.error('Error loading correspondentes:', error);
        }
      });
    }
    
    // Load actual solicitation statuses from backend
    this.solicitacaoStatusService.getSolicitacaoStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses;
      },
      error: (error) => {
        console.error('Error loading solicitation statuses:', error);
        // Fallback to hardcoded options if backend fails
        this.statuses = [
          { idstatus: 0, status: 'Todos' },
          { idstatus: 1, status: 'Pendente' },
          { idstatus: 2, status: 'Em Andamento' },
          { idstatus: 3, status: 'Finalizada' },
          { idstatus: 4, status: 'Cancelada' }
        ];
      }
    });
  }

  applyFilters(): void {
    this.emitFilterChange();
  }

  private emitFilterChange(): void {
    const formValue = this.filterForm.value;
    const filterCriteria: RequestFilterCriteria = {
      status: formValue.status || '',
      search: formValue.search || '',
      processo: formValue.processo || '',
      tipo: formValue.tipo || '',
      comarca: formValue.comarca,
      correspondenteId: formValue.correspondenteId,
      correspondenteText: formValue.correspondenteText || '',
      dataSolicitacaoFrom: formValue.dataSolicitacaoFrom,
      dataSolicitacaoTo: formValue.dataSolicitacaoTo,
      dataPrazoFrom: formValue.dataPrazoFrom,
      dataPrazoTo: formValue.dataPrazoTo
    };
    
    this.filterChange.emit(filterCriteria);
  }

  onClearFilters(): void {
    this.filterForm.reset({
      status: '',
      search: '',
      processo: '',
      tipo: '',
      comarca: null,
      correspondenteId: null,
      correspondenteText: '',
      dataSolicitacaoFrom: null,
      dataSolicitacaoTo: null,
      dataPrazoFrom: null,
      dataPrazoTo: null
    });
    this.clearFilters.emit();
  }

  setFilterValues(filters: Partial<RequestFilterCriteria>): void {
    this.filterForm.patchValue(filters);
  }

  getFilterValues(): RequestFilterCriteria {
    const formValue = this.filterForm.value;
    return {
      status: formValue.status || '',
      search: formValue.search || '',
      processo: formValue.processo || '',
      tipo: formValue.tipo || '',
      comarca: formValue.comarca,
      correspondenteId: formValue.correspondenteId,
      correspondenteText: formValue.correspondenteText || '',
      dataSolicitacaoFrom: formValue.dataSolicitacaoFrom,
      dataSolicitacaoTo: formValue.dataSolicitacaoTo,
      dataPrazoFrom: formValue.dataPrazoFrom,
      dataPrazoTo: formValue.dataPrazoTo
    };
  }
}