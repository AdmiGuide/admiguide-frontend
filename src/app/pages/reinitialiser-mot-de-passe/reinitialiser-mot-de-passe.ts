import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import {
  LucideArrowLeft,
  LucideFileText,
  LucideHistory,
  LucideUserRound,
} from '@lucide/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reinitialiser-mot-de-passe',

  // Modules et composants utilisés dans le template.
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideFileText,
    LucideHistory,
    LucideUserRound,
  ],

  templateUrl: './reinitialiser-mot-de-passe.html',
  styleUrl: './reinitialiser-mot-de-passe.css',
})
export class ReinitialiserMotDePasse {

  // Permet de créer et gérer le formulaire réactif.
  private readonly formBuilder = inject(FormBuilder);

  // Service utilisé pour communiquer avec l'API Django.
  private readonly authService = inject(AuthService);

  // Permet de récupérer le uid et le token présents dans l'URL.
  private readonly route = inject(ActivatedRoute);

  // Indique si la réinitialisation est en cours.
  readonly isLoading = signal(false);

  // Message affiché lorsque le mot de passe a été modifié.
  readonly successMessage = signal('');

  // Message affiché lorsqu'une erreur survient.
  readonly errorMessage = signal('');

  // Récupère l'identifiant encodé transmis dans le lien reçu par e-mail.
  private readonly uid =
    this.route.snapshot.paramMap.get('uid') ?? '';

  // Récupère le token de réinitialisation transmis dans le lien.
  private readonly token =
    this.route.snapshot.paramMap.get('token') ?? '';

  // Formulaire permettant de saisir le nouveau mot de passe.
  readonly resetPasswordForm =
    this.formBuilder.nonNullable.group({
      newPassword: [
        '',
        Validators.required,
      ],

      confirmPassword: [
        '',
        Validators.required,
      ],
    });

  // Réinitialise le mot de passe de l'utilisateur.
  resetPassword(): void {

    // Empêche l'envoi si le formulaire est invalide
    // ou si une requête est déjà en cours.
    if (
      this.resetPasswordForm.invalid ||
      this.isLoading()
    ) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    // Récupère les deux mots de passe saisis.
    const {
      newPassword,
      confirmPassword,
    } = this.resetPasswordForm.getRawValue();

    // Vérifie que les deux mots de passe correspondent.
    if (newPassword !== confirmPassword) {
      this.errorMessage.set(
        'Les mots de passe ne correspondent pas.',
      );

      return;
    }

    // Vérifie que le lien contient bien
    // un identifiant et un token.
    if (!this.uid || !this.token) {
      this.errorMessage.set(
        'Le lien de réinitialisation est invalide.',
      );

      return;
    }

    // Active le chargement et efface les anciens messages.
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // Envoie le nouveau mot de passe au backend Django.
    this.authService
      .confirmPasswordReset(
        this.uid,
        this.token,
        newPassword,
        confirmPassword,
      )
      .subscribe({

        // Le mot de passe a été réinitialisé avec succès.
        next: (response) => {
          this.successMessage.set(
            response.detail,
          );

          // Vide les champs après la réussite.
          this.resetPasswordForm.reset();

          this.isLoading.set(false);
        },

        // Une erreur est survenue pendant l'appel HTTP.
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la réinitialisation du mot de passe :',
            error,
          );

          // Le frontend n'arrive pas à joindre l'API.
          if (error.status === 0) {
            this.errorMessage.set(
              'Impossible de contacter le serveur.',
            );
          }

          // Django refuse le nouveau mot de passe.
          else if (error.error?.new_password) {
            this.errorMessage.set(
              error.error.new_password[0],
            );
          }

          // Autre erreur retournée par l'API.
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