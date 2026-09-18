import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
} from 'rxjs';

import { LucideSearch } from '@lucide/angular';

import { AdminSource } from '../../models/admin-source.model';
import { AdminService } from '../../services/admin.service';

type SourceStatusFilter =
  | 'tous'
  | 'DISPONIBLE'
  | 'A_VERIFIER';

@Component({
  selector: 'app-admin-sources',
  imports: [
    FormsModule,
    LucideSearch,
  ],
  templateUrl: './admin-sources.html',
  styleUrl: './admin-sources.css',
})
export class AdminSources implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  // Déclenche la recherche après un court délai.
  private readonly searchSubject = new Subject<string>();

  // Sources de la page actuelle.
  readonly sources = signal<AdminSource[]>([]);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  // Informations de pagination.
  readonly totalSources = signal(0);
  readonly hasNextPage = signal(false);
  readonly hasPreviousPage = signal(false);

  currentPage = 1;
  readonly pageSize = 5;

  searchTerm = '';

  selectedStatus: SourceStatusFilter = 'tous';

  // Format français pour les dates.
  private readonly dateFormatter =
    new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  ngOnInit(): void {
    // Attend 300 ms avant de lancer la recherche.
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadSources();
      });

    this.loadSources();
  }

  // Charge les sources depuis Django.
  private loadSources(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const statut =
      this.selectedStatus === 'tous'
        ? ''
        : this.selectedStatus;

    this.adminService
      .getSources(
        this.currentPage,
        this.searchTerm,
        statut,
      )
      .subscribe({
        next: (response) => {
          this.sources.set(response.results);
          this.totalSources.set(response.count);

          this.hasNextPage.set(
            response.next !== null,
          );

          this.hasPreviousPage.set(
            response.previous !== null,
          );

          this.loading.set(false);
        },

        error: () => {
          this.errorMessage.set(
            'Impossible de charger les sources.',
          );

          this.loading.set(false);
        },
      });
  }

  // Nombre total de pages.
  get totalPages(): number {
    return Math.ceil(
      this.totalSources() / this.pageSize,
    );
  }

  // Change le filtre de statut.
  selectStatus(
    status: SourceStatusFilter,
  ): void {
    this.selectedStatus = status;
    this.currentPage = 1;

    this.loadSources();
  }

  // Lance la recherche avec un délai.
  onSearchChange(): void {
    this.searchSubject.next(
      this.searchTerm.trim(),
    );
  }

  // Affiche la page précédente.
  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }

    this.currentPage--;
    this.loadSources();
  }

  // Affiche la page suivante.
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.currentPage++;
    this.loadSources();
  }

  // Formate la date du dernier contrôle.
  formatDate(value: string | null): string {
    if (!value) {
      return 'Non contrôlée';
    }

    const [year, month, day] = value
      .slice(0, 10)
      .split('-')
      .map(Number);

    return this.dateFormatter.format(
      new Date(year, month - 1, day),
    );
  }
}