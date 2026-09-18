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

import { LucideSearch, LucideX } from '@lucide/angular';

import { AdminUser } from '../../models/admin-user.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  imports: [
    FormsModule,
    LucideSearch,
    LucideX
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  // Déclenche la recherche après un court délai.
  private readonly searchSubject = new Subject<string>();

  // Utilisateurs de la page actuelle.
  readonly users = signal<AdminUser[]>([]);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  // Informations de pagination.
  readonly totalUsers = signal(0);
  readonly hasNextPage = signal(false);
  readonly hasPreviousPage = signal(false);

  // Compte actuellement sélectionné.
  readonly selectedUser = signal<AdminUser | null>(null);

  // État de la modale.
  readonly modalState = signal<
    'manage' | 'suspended' | 'reactivated' | null
  >(null);

  // État de l'action suspendre/réactiver.
  readonly actionLoading = signal(false);

  // Ouvre la gestion d'un compte.
  openUserModal(user: AdminUser): void {
    this.selectedUser.set(user);
    this.modalState.set('manage');
    this.actionError.set('');
  }

  // Ferme la modale.
  closeUserModal(): void {
    this.selectedUser.set(null);
    this.modalState.set(null);
    this.actionError.set('');
  }

  // Suspend le compte sélectionné.
  suspendUser(): void {
    const user = this.selectedUser();

    if (!user || !user.is_active) {
      return;
    }

    this.updateUserStatus(user, false);
  }

  // Réactive le compte sélectionné.
  reactivateUser(): void {
    const user = this.selectedUser();

    if (!user || user.is_active) {
      return;
    }

    this.updateUserStatus(user, true);
  }

  // Met à jour le statut du compte.
  private updateUserStatus(
    user: AdminUser,
    isActive: boolean,
  ): void {
    this.actionLoading.set(true);
    this.actionError.set('');

    this.adminService
      .updateUserStatus(user.id, isActive)
      .subscribe({
        next: (updatedUser) => {
          this.selectedUser.set(updatedUser);

          this.modalState.set(
            isActive ? 'reactivated' : 'suspended',
          );

          this.actionLoading.set(false);

          // Recharge la liste pour refléter le nouveau statut.
          this.loadUsers();
        },

        error: (error) => {
          const backendMessage =
            error.error?.is_active?.[0];

          this.actionError.set(
            backendMessage ??
            'Impossible de modifier le statut du compte.',
          );

          this.actionLoading.set(false);
        },
      });
  }

  readonly actionError = signal('');

  currentPage = 1;
  readonly pageSize = 5;

  searchTerm = '';

  selectedFilter: 'tous' | 'actif' | 'suspendu' = 'tous';

  ngOnInit(): void {
    // Attend 300 ms après la saisie avant de lancer la recherche.
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadUsers();
      });

    this.loadUsers();
  }

  // Charge une page depuis Django.
  private loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.adminService
      .getUsers(
        this.currentPage,
        this.searchTerm,
        this.selectedFilter,
      )
      .subscribe({
        next: (response) => {
          this.users.set(response.results);
          this.totalUsers.set(response.count);

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
            'Impossible de charger les utilisateurs.',
          );

          this.loading.set(false);
        },
      });
  }

  // Nombre total de pages.
  get totalPages(): number {
    return Math.ceil(
      this.totalUsers() / this.pageSize,
    );
  }

  // Change le filtre et revient à la première page.
  selectFilter(
    filter: 'tous' | 'actif' | 'suspendu',
  ): void {
    this.selectedFilter = filter;
    this.currentPage = 1;

    this.loadUsers();
  }

  // Prépare une recherche avec un délai de 300 ms.
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
    this.loadUsers();
  }

  // Affiche la page suivante.
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.currentPage++;
    this.loadUsers();
  }

  // Traduit le rôle pour l'affichage.
  getRoleLabel(role: 'user' | 'admin'): string {
    return role === 'admin'
      ? 'Administrateur'
      : 'Utilisateur';
  }
}