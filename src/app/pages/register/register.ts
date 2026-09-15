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
import { COUNTRIES } from '../../data/countries';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowRight,
    LucideFileText,
    LucideHistory,
    LucideUserRound,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  // Construit et gère le formulaire réactif.
  private readonly formBuilder = inject(FormBuilder);

  // Gère les appels API liés à l'authentification.
  private readonly authService = inject(AuthService);

  // Gère les redirections entre les pages Angular.
  private readonly router = inject(Router);

  // États utilisés pour informer l'interface.
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  // Liste utilisée par le champ pays de résidence.
  readonly countries = COUNTRIES;

  // Autorise les lettres, espaces, apostrophes et tirets.
  private readonly namePattern =
    /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;

  // Refuse un mot de passe composé uniquement de chiffres.
  private readonly passwordPattern =
    /^(?!\d+$).+$/;

  // Formulaire d'inscription et règles de validation côté frontend.
  readonly registerForm = this.formBuilder.nonNullable.group({
    nom_complet: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(200),
        Validators.pattern(this.namePattern),
      ],
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    ],

    pays_residence: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
      ],
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern),
      ],
    ],

    conditions: [
      false,
      Validators.requiredTrue,
    ],
  });

  // Vérifie le formulaire puis envoie les données au backend.
  register(): void {
    // Empêche l'envoi si le formulaire est invalide
    // ou si une requête est déjà en cours.
    if (this.registerForm.invalid || this.isLoading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Récupère les valeurs saisies dans le formulaire.
    const {
      nom_complet,
      email,
      pays_residence,
      password,
    } = this.registerForm.getRawValue();

    // Envoie uniquement les champs attendus par Django.
    this.authService
      .register({
        nom_complet: nom_complet.trim(),
        email: email.trim(),
        pays_residence,
        password,
      })
      .subscribe({
        // Après création du compte, l'utilisateur
        // est redirigé vers la page de connexion.
        next: () => {
          this.router.navigate(['/connexion']);
        },

        // Gère les erreurs retournées par l'API Django.
        error: (error: HttpErrorResponse) => {
          console.error('Erreur inscription :', error);

          if (error.status === 0) {
            this.errorMessage.set(
              'Impossible de contacter le serveur.',
            );
          } else if (error.status === 400) {
            this.errorMessage.set(
              this.getBackendError(error),
            );
          } else {
            this.errorMessage.set(
              'Une erreur est survenue lors de la création du compte.',
            );
          }

          this.isLoading.set(false);
        },
      });
  }

  // Transforme les erreurs Django en message lisible
  // pour l'utilisateur.
  private getBackendError(error: HttpErrorResponse): string {
    const errors = error.error;

    if (errors?.email) {
      return Array.isArray(errors.email)
        ? errors.email[0]
        : errors.email;
    }

    if (errors?.password) {
      return Array.isArray(errors.password)
        ? errors.password[0]
        : errors.password;
    }

    if (errors?.nom_complet) {
      return Array.isArray(errors.nom_complet)
        ? errors.nom_complet[0]
        : errors.nom_complet;
    }

    if (errors?.pays_residence) {
      return Array.isArray(errors.pays_residence)
        ? errors.pays_residence[0]
        : errors.pays_residence;
    }

    return 'Vérifiez les informations saisies.';
  }
}