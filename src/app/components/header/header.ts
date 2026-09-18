import {
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  // Gère l'état d'authentification de l'utilisateur.
  readonly authService = inject(AuthService);

  // Permet de rediriger après déconnexion.
  private readonly router = inject(Router);

  // Contrôle l'ouverture du menu mobile.
  isMenuOpen = false;

  // Calcule les initiales de l'utilisateur connecté.
  readonly userInitials = computed(() => {
    const user = this.authService.currentUser();

    if (!user?.nom_complet) {
      return '';
    }

    const names = user.nom_complet
      .trim()
      .split(/\s+/);

    const firstInitial = names[0]?.[0] ?? '';

    const lastInitial =
      names.length > 1
        ? names[names.length - 1]?.[0] ?? ''
        : '';

    return `${firstInitial}${lastInitial}`.toUpperCase();
  });

  // Ouvre ou ferme le menu mobile.
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Ferme le menu mobile.
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  // Déconnecte l'utilisateur puis retourne à l'accueil.
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.closeMenu();
        this.router.navigate(['/']);
      },

      // La session locale est nettoyée même si le backend ne répond pas.
      error: () => {
        this.closeMenu();
        this.router.navigate(['/']);
      },
    });
  }
}