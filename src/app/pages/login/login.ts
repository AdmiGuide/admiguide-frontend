import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideFileText,
  LucideHistory,
  LucideUserRound,
} from '@lucide/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowRight,
    LucideFileText,
    LucideHistory,
    LucideUserRound,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // États de l'interface.
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  // Formulaire de connexion.
  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // Connecte l'utilisateur puis redirige vers l'accueil.
  login(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (user) => {
      // L'administrateur accède directement à son espace.
      if (user.role === 'admin') {
        this.router.navigate(['/admin']);
        return;
      }

      // L'utilisateur normal accède à son historique.
      this.router.navigate(['/espace/historique']);
    },

      error: (error: HttpErrorResponse) => {
        console.error('Erreur de connexion :', error);

        if (error.status === 0) {
          this.errorMessage.set(
            'Impossible de contacter le serveur.',
          );
        } else if (error.status === 401) {
          this.errorMessage.set(
            'Adresse e-mail ou mot de passe incorrect.',
          );
        } else {
          this.errorMessage.set(
            error.error?.detail ||
              error.error?.message ||
              'Une erreur est survenue lors de la connexion.',
          );
        }

        this.isLoading.set(false);
      },
    });
  }
}