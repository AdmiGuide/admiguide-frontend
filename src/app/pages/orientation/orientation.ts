import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideFileText,
  LucideInfo,
} from '@lucide/angular';

import { OrientationService } from '../../services/orientation.service';
import { AuthService } from '../../services/auth.service';

import { OrientationLoading } from '../../components/orientation-loading/orientation-loading';
import { OrientationError } from '../../components/orientation-error/orientation-error';


@Component({
  selector: 'app-orientation',

  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideArrowRight,
    LucideFileText,
    LucideInfo,
    OrientationLoading,
    OrientationError,
  ],

  templateUrl: './orientation.html',
  styleUrl: './orientation.css',
})
export class Orientation {

  // Permet de savoir si l'utilisateur est connecté.
  private readonly authService =
    inject(AuthService);

  // Service métier de l'orientation.
  private readonly orientationService =
    inject(OrientationService);

  // Permet de changer de page selon
  // la réponse retournée par Django.
  private readonly router =
    inject(Router);

  // Requête d'analyse en cours.
  private analysisSubscription?: Subscription;

  readonly hasTechnicalError =
    signal(false);


  // ================= LIMITES =================

  readonly maxLength = 1500;

  readonly minLength = 20;


  // ================= ÉTATS =================

  // Description saisie par l'utilisateur.
  // Récupère aussi l'exemple choisi depuis la page d'accueil.
  readonly situation =
    signal(
      this.router.currentNavigation()
        ?.extras.state?.['situation'] ?? '',
    );

  // Message d'erreur affiché sous le champ.
  readonly errorMessage =
    signal('');

  // Indique que l'analyse est en cours.
  readonly isLoading =
    signal(false);


  // ================= SAISIE =================

  onSituationInput(
    event: Event,
  ): void {

    const textarea =
      event.target as HTMLTextAreaElement;

    this.situation.set(
      textarea.value,
    );

    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }


  // Remplit le champ avec l'exemple.
  useExample(): void {

    this.situation.set(
      'Je vis en France et mon enfant vient de naître.',
    );

    this.errorMessage.set('');
  }


  // ================= ENVOI =================

  submitSituation(): void {

    const description =
      this.situation().trim();


    // Évite plusieurs appels simultanés.
    if (this.isLoading()) {
      return;
    }


    // ================= VALIDATION =================

    if (!description) {

      this.errorMessage.set(
        'Décrivez votre situation avant de continuer.',
      );

      return;
    }


    if (
      description.length <
      this.minLength
    ) {

      this.errorMessage.set(
        `Décrivez votre situation avec au moins ${this.minLength} caractères.`,
      );

      return;
    }


    // Nettoie les anciens messages
    // avant une nouvelle analyse.
    this.errorMessage.set('');
    this.hasTechnicalError.set(false);
    this.isLoading.set(true);


    // ================= APPEL API =================

    this.analysisSubscription =
      this.orientationService
        .createSituation({
          description_initiale:
            description,
        })
        .subscribe({

          next: (response) => {

            this.isLoading.set(false);


            // Garde temporairement la description
            // pour l'écran des précisions.
            sessionStorage.setItem(
              `admiguide_situation_${response.public_id}`,
              response.description_initiale,
            );


            // ================= ORIENTATION =================
            if (
              response.analyse.statut ===
              'ORIENTATION'
            ) {

              // Un visiteur doit d'abord renseigner
              // son pays de résidence.
              if (
                !this.authService.isAuthenticated()
              ) {

                this.router.navigate([
                  '/orientation/precisions',
                  response.public_id,
                ]);

                return;
              }


              // L'utilisateur connecté possède déjà
              // un pays de résidence dans son profil.
              this.router.navigate([
                '/orientation/resultat',
                response.public_id,
              ]);

              return;
            }


            // ================= PRÉCISIONS =================
            if (
              response.analyse.statut ===
              'PRECISIONS_REQUISES'
            ) {

              this.router.navigate([
                '/orientation/precisions',
                response.public_id,
              ]);

              return;
            }


            // ================= SOURCES INSUFFISANTES =================
            if (
              response.analyse.statut ===
              'SOURCES_INSUFFISANTES'
            ) {

              this.router.navigate([
                '/orientation/sources-insuffisantes',
                response.public_id,
              ]);

              return;
            }


            // Statut inattendu :
            // l'analyse n'a pas pu aboutir correctement.
            this.hasTechnicalError.set(true);
          },


          error: (
            error: HttpErrorResponse,
          ) => {

            console.error(
              'Erreur analyse situation :',
              error,
            );


            // Cache l'écran de chargement.
            this.isLoading.set(false);


            // ================= ERREUR DE VALIDATION =================

            if (error.status === 400) {

              this.errorMessage.set(
                'Vérifiez les informations saisies.',
              );

              return;
            }


            // ================= ERREUR TECHNIQUE =================
            // Serveur inaccessible, erreur 500,
            // réseau, timeout, etc.
            this.hasTechnicalError.set(true);
          },
        });
  }


  // Relance la même analyse
  // avec la description conservée.
  retryAnalysis(): void {

    this.hasTechnicalError.set(false);

    this.submitSituation();
  }


  // Annule l'appel HTTP en cours
  // et revient au formulaire conservé.
  cancelAnalysis(): void {

    this.analysisSubscription?.unsubscribe();

    this.isLoading.set(false);
  }
}