import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { ComarcaService } from '../../../core/services/comarca.service';
import { AuthService } from '../../../core/services/auth.service';
import { Comarca } from '../../../shared/models/comarca.model';

@Component({
  selector: 'app-comarca-detail',
  templateUrl: './comarca-detail.component.html',
  styleUrls: ['./comarca-detail.component.scss']
})
export class ComarcaDetailComponent implements OnInit, OnDestroy {
  comarca: Comarca | null = null;
  loading = true;
  comarcaId: number | null = null;

  private themeSubscription: Subscription | null = null;

  constructor(
    private comarcaService: ComarcaService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check if user has appropriate role
    if (!this.authService.hasAnyRole(['ROLE_ADMIN', 'ROLE_ADVOGADO'])) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    // Get comarca ID from route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.comarcaId = +params['id'];
        this.loadComarca();
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

  loadComarca(): void {
    if (!this.comarcaId) return;

    this.comarcaService.getComarcaById(this.comarcaId).subscribe({
      next: (comarca) => {
        this.comarca = comarca;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading comarca:', error);
        this.loading = false;
        this.snackBar.open('Erro ao carregar comarca', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/comarcas']);
      }
    });
  }

  editComarca(): void {
    if (this.comarca?.id) {
      this.router.navigate(['/comarcas/editar', this.comarca.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/comarcas']);
  }
}