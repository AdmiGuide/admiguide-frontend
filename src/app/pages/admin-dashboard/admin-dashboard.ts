import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  finalize,
  forkJoin,
} from 'rxjs';

import { AdminSource } from '../../models/admin-source.model';
import { AdminSignalement } from '../../models/admin-signalement.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterLink,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  // Statistiques utilisateurs.
  readonly totalUsers = signal(0);
  readonly activeUsers = signal(0);

  // Statistiques sources.
  readonly totalSources = signal(0);
  readonly sourcesToVerify = signal(0);

  // Sources récentes affichées dans le résumé.
  readonly recentSources = signal<AdminSource[]>([]);

  // Signalements encore à examiner.
  readonly newSignalements = signal(0);
  readonly recentSignalements = signal<AdminSignalement[]>([]);

  ngOnInit(): void {
    this.loadDashboard();
  }

  // Charge les données déjà disponibles dans les API admin.
  private loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      users: this.adminService.getUsers(
        1,
        '',
        'tous',
      ),

      activeUsers: this.adminService.getUsers(
        1,
        '',
        'actif',
      ),

      sources: this.adminService.getSources(
        1,
      ),

      sourcesToVerify: this.adminService.getSources(
        1,
        '',
        'A_VERIFIER',
      ),

      signalements: this.adminService.getSignalements(
        1,
        '',
        'NOUVEAU',
      ),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.totalUsers.set(
            response.users.count,
          );

          this.activeUsers.set(
            response.activeUsers.count,
          );

          this.totalSources.set(
            response.sources.count,
          );

          this.sourcesToVerify.set(
            response.sourcesToVerify.count,
          );

          this.newSignalements.set(
            response.signalements.count,
          );

          this.recentSignalements.set(
            response.signalements.results.slice(0, 3),
          );

          // La vue d'ensemble montre seulement
          // quelques sources récentes.
          this.recentSources.set(
            response.sources.results.slice(0, 3),
          );
        },

        error: () => {
          this.errorMessage.set(
            'Impossible de charger les données de l\'administration.',
          );
        },
      });
  }

  // Formate les dates des signalements récents.
  formatDate(value: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }
}