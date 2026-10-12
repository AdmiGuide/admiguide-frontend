import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideFileText,
  LucideHistory,
  LucideUserRound,
} from '@lucide/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mot-de-passe-oublie',

  // Modules et composants utilisés dans le template.
  imports: [
  ReactiveFormsModule,
  RouterLink,
  LucideArrowLeft,
  LucideFileText,
  LucideHistory,
  LucideUserRound,
],

  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: './mot-de-passe-oublie.css',
})
export class MotDePasseOublie {

  // Permet de créer et gérer le formulaire réactif.
  private readonly formBuilder = inject(FormBuilder);

  // Service utilisé pour communiquer avec l'API d'authentification.
  private readonly authService = inject(AuthService);

  // Indique si la demande est en cours d'envoi.
  readonly isLoading = signal(false);

  // Message affiché lorsque la demande a réussi.
  readonly successMessage = signal('');

  // Message affiché lorsqu'une erreur survient.
  readonly errorMessage = signal('');

  // Formulaire contenant l'adresse e-mail de l'utilisateur.
  readonly resetForm = this.formBuilder.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],
  });

  // Envoie une demande de réinitialisation du mot de passe.
  requestReset(): void {

    // Empêche l'envoi si le formulaire est invalide
    // ou si une demande est déjà en cours.
    if (
      this.resetForm.invalid ||
      this.isLoading()
    ) {
      this.resetForm.markAllAsTouched();
      return;
    }

    // Active l'état de chargement
    // et réinitialise les anciens messages.
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // Récupère l'adresse e-mail saisie dans le formulaire.
    const email = this.resetForm.controls.email.value;

    // Envoie l'adresse e-mail au backend Django.
    this.authService
      .requestPasswordReset(email)
      .subscribe({

        // La demande a été traitée correctement.
        next: (response) => {
          this.successMessage.set(
            response.detail,
          );

          this.isLoading.set(false);
        },

        // Une erreur est survenue pendant l'appel HTTP.
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la demande de réinitialisation :',
            error,
          );

          // Le frontend n'arrive pas à joindre l'API.
          if (error.status === 0) {
            this.errorMessage.set(
              'Impossible de contacter le serveur.',
            );
          }

          // Une autre erreur a été retournée par l'API.
          else {
            this.errorMessage.set(
              error.error?.detail ||
                'Une erreur est survenue. Veuillez réessayer.',
            );
          }

          this.isLoading.set(false);
        },
      });
  }
}