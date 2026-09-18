import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  LucideArrowRight,
  LucideX,
} from '@lucide/angular';

import {
  AdminSignalement,
  SignalementStatus,
} from '../../models/admin-signalement.model';
import { AdminService } from '../../services/admin.service';

type SignalementFilter =
  | 'tous'
  | SignalementStatus;

@Component({
  selector: 'app-admin-signalements',
  imports: [
    LucideArrowRight,
    LucideX,
  ],
  templateUrl: './admin-signalements.html',
  styleUrl: './admin-signalements.css',
})
export class AdminSignalements implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly signalements = signal<AdminSignalement[]>([]);
  readonly selectedSignalement =
    signal<AdminSignalement | null>(null);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly actionLoading = signal(false);
  readonly actionError = signal('');

  readonly totalSignalements = signal(0);
  readonly hasNextPage = signal(false);
  readonly hasPreviousPage = signal(false);

  currentPage = 1;
  readonly pageSize = 5;

  selectedStatus: SignalementFilter = 'tous';

  private readonly dateFormatter =
    new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  ngOnInit(): void {
    this.loadSignalements();
  }

  // Charge les signalements depuis l'API.
  private loadSignalements(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.adminService
      .getSignalements(
        this.currentPage,
        '',
        this.selectedStatus,
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.signalements.set(response.results);
          this.totalSignalements.set(response.count);

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
            'Impossible de charger les signalements.',
          );

          this.loading.set(false);
        },
      });
  }

  get totalPages(): number {
    return Math.ceil(
      this.totalSignalements() / this.pageSize,
    );
  }

  // Filtre les signalements selon leur statut.
  selectStatus(status: SignalementFilter): void {
    this.selectedStatus = status;
    this.currentPage = 1;

    this.loadSignalements();
  }

  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }

    this.currentPage--;
    this.loadSignalements();
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.currentPage++;
    this.loadSignalements();
  }

  // Ouvre la fenêtre d'examen.
  openSignalement(
    signalement: AdminSignalement,
  ): void {
    this.selectedSignalement.set(signalement);
    this.actionError.set('');
  }

  closeSignalement(): void {
    if (this.actionLoading()) {
      return;
    }

    this.selectedSignalement.set(null);
    this.actionError.set('');
  }

  // Passe le signalement au statut En cours.
  takeInCharge(): void {
    this.updateStatus('EN_COURS');
  }

  // Termine le traitement du signalement.
  completeTreatment(): void {
    this.updateStatus('TRAITE');
  }

  // Met à jour uniquement le statut dans le MVP.
  private updateStatus(
    status: SignalementStatus,
  ): void {
    const signalement =
      this.selectedSignalement();

    if (!signalement) {
      return;
    }

    this.actionLoading.set(true);
    this.actionError.set('');

    this.adminService
      .updateSignalement(
        signalement.id,
        {
          statut: status,
        },
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.selectedSignalement.set(null);

          // Recharge la liste pour respecter
          // le filtre actuellement sélectionné.
          this.loadSignalements();
        },

        error: () => {
          this.actionError.set(
            'Impossible de modifier le statut du signalement.',
          );

          this.actionLoading.set(false);
        },
      });
  }

  formatDate(value: string): string {
    return this.dateFormatter.format(
      new Date(value),
    );
  }
}