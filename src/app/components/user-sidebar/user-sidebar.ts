import { Component, inject, Input } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import {
  LucideHistory,
  LucideLogOut,
  LucidePlus,
  LucideUserRound,
} from '@lucide/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideHistory,
    LucideUserRound,
    LucidePlus,
    LucideLogOut,
  ],
  templateUrl: './user-sidebar.html',
  styleUrl: './user-sidebar.css',
})
export class UserSidebar {
  // Indique si le composant doit afficher la navigation mobile ou desktop.
  @Input() mode: 'mobile' | 'desktop' = 'desktop';

  // Gère l'authentification et la déconnexion.
  private readonly authService = inject(AuthService);

  // Permet de rediriger l'utilisateur après déconnexion.
  private readonly router = inject(Router);

  // Déconnecte l'utilisateur puis retourne à l'accueil.
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },

      // La session locale est également nettoyée si le backend ne répond pas.
      error: () => {
        this.router.navigate(['/']);
      },
    });
  }
}