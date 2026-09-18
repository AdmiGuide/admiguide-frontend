import { Component, inject, Input } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import {
  LucideGlobe,
  LucideFlag,
  LucideLayoutDashboard,
  LucideLogOut,
  LucidePlus,
  LucideUsers,
} from '@lucide/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideUsers,
    LucideGlobe,
    LucideFlag,
    LucidePlus,
    LucideLogOut,
  ],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css',
})
export class AdminSidebar {
  // Même composant pour mobile et desktop.
  @Input() mode: 'mobile' | 'desktop' = 'desktop';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Déconnecte l'administrateur.
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },

      error: () => {
        this.router.navigate(['/']);
      },
    });
  }
}