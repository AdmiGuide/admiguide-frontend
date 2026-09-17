import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  LucideArrowLeft,
  LucideCheck,
  LucideHistory,
  LucideListChecks,
} from '@lucide/angular';

import {
  OrientationService,
} from '../../services/orientation.service';

import {
  OrientationResultData,
  OrientationProgression,
} from '../../models/orientation-result.model';


@Component({
  selector: 'app-follow-up',

  imports: [
  RouterLink,
  LucideArrowLeft,
  LucideCheck,
  LucideHistory,
  LucideListChecks,
],

  templateUrl: './follow-up.html',
  styleUrl: './follow-up.css',
})
export class FollowUp implements OnInit {

  // ==================== SERVICES ====================

  private readonly route =
    inject(ActivatedRoute);

  private readonly orientationService =
    inject(OrientationService);


  // ==================== DONNÉES ====================

  // UUID public de la situation.
  private publicId = '';


  // Résultat complet de l'orientation.
  readonly result =
    signal<OrientationResultData | null>(null);


  // ==================== ÉTATS DE LA PAGE ====================

  readonly isLoading =
    signal(true);

  readonly errorMessage =
    signal('');


  // ID de l'étape actuellement mise à jour.
  // Permet d'éviter plusieurs clics simultanés.
  readonly updatingStepId =
    signal<number | null>(null);


  // ==================== INITIALISATION ====================

  ngOnInit(): void {

    this.publicId =
      this.route.snapshot.paramMap.get(
        'publicId',
      ) ?? '';


    if (!this.publicId) {

      this.errorMessage.set(
        'Cette démarche est introuvable.',
      );

      this.isLoading.set(false);

      return;
    }


    this.loadFollowUp();
  }


  // ==================== CHARGEMENT ====================

  // Charge la démarche et sa progression.
  private loadFollowUp(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');


    this.orientationService
      .getResult(this.publicId)
      .subscribe({

        next: (result) => {

          this.result.set(result);

          this.isLoading.set(false);
        },


        error: (
          error: HttpErrorResponse,
        ) => {

          console.error(
            'Erreur chargement suivi :',
            error,
          );


          this.isLoading.set(false);


          if (error.status === 404) {

            this.errorMessage.set(
              'Cette démarche est introuvable.',
            );

            return;
          }


          if (error.status === 401) {

            this.errorMessage.set(
              'Vous devez être connecté pour consulter ce suivi.',
            );

            return;
          }


          this.errorMessage.set(
            'Impossible de charger le suivi de cette démarche.',
          );
        },
      });
  }


  // ==================== MISE À JOUR D'UNE ÉTAPE ====================

  toggleStep(
    etapeId: number,
    currentState: boolean,
  ): void {

    // Empêche plusieurs modifications
    // pendant qu'une requête est en cours.
    if (this.updatingStepId() !== null) {
      return;
    }


    this.errorMessage.set('');

    this.updatingStepId.set(
      etapeId,
    );


    this.orientationService
      .updateStep(
        this.publicId,
        etapeId,
        {
          terminee: !currentState,
        },
      )
      .subscribe({

        next: (response) => {

          const currentResult =
            this.result();


          if (!currentResult) {

            this.updatingStepId.set(null);

            return;
          }


          // Met à jour uniquement l'étape concernée.
          const updatedSteps =
            currentResult.etapes.map(
              (etape) => {

                if (
                  etape.id ===
                  response.etape_id
                ) {

                  return {
                    ...etape,
                    terminee:
                      response.terminee,
                  };
                }


                return etape;
              },
            );


          // Met à jour les étapes
          // et la progression sans recharger la page.
          this.result.set({
            ...currentResult,

            etapes: updatedSteps,

            progression:
              response.progression,
          });


          this.updatingStepId.set(null);
        },


        error: (
          error: HttpErrorResponse,
        ) => {

          console.error(
            'Erreur mise à jour étape :',
            error,
          );


          this.updatingStepId.set(null);


          if (error.status === 401) {

            this.errorMessage.set(
              'Vous devez être connecté pour modifier votre progression.',
            );

            return;
          }


          if (error.status === 404) {

            this.errorMessage.set(
              'Cette étape est introuvable.',
            );

            return;
          }


          this.errorMessage.set(
            'Impossible de mettre à jour cette étape pour le moment.',
          );
        },
      });
  }


  // ==================== OUTILS ====================

  // Indique si une étape est
  // actuellement en cours de modification.
  isUpdatingStep(
    etapeId: number,
  ): boolean {

    return (
      this.updatingStepId() ===
      etapeId
    );
  }


  // Permet de relancer le chargement
  // après une erreur.
  retry(): void {

    this.loadFollowUp();
  }
}