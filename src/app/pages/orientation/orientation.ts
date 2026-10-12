import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideFileText,
  LucideInfo,
  LucideMic,
} from '@lucide/angular';

import { OrientationService } from '../../services/orientation.service';

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
    LucideMic,
    OrientationLoading,
    OrientationError,
  ],

  templateUrl: './orientation.html',
  styleUrl: './orientation.css',
})
export class Orientation {

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

    // ================= SAISIE VOCALE =================

  // Indique si le microphone est actuellement en écoute.
  readonly isRecording = signal(false);

  // Message affiché à l'utilisateur pendant la dictée.
  readonly voiceMessage = signal('');

  // Enregistreur audio du navigateur.
  private mediaRecorder?: MediaRecorder;

  // Flux provenant du microphone.
  private microphoneStream?: MediaStream;

  // Morceaux audio reçus pendant l'enregistrement.
  private audioChunks: Blob[] = [];

  async toggleVoiceRecording(): Promise<void> {

    // Si un enregistrement est déjà en cours,
    // un nouveau clic permet de l'arrêter.
    if (this.isRecording()) {
      this.stopVoiceRecording();
      return;
    }

    await this.startVoiceRecording();
  }

  private async startVoiceRecording(): Promise<void> {

  try {

    this.voiceMessage.set('');

    // Demande l'accès au microphone.
    // Ces options activent les traitements audio
    // proposés par le navigateur.
    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

    this.microphoneStream = stream;

    // Réinitialise l'ancien enregistrement.
    this.audioChunks = [];

    // Crée l'enregistreur audio.
    this.mediaRecorder =
      new MediaRecorder(stream);

    // Chaque morceau audio reçu est conservé.
    this.mediaRecorder.ondataavailable =
      (event: BlobEvent) => {

        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

    // Lorsque l'enregistrement est arrêté.
    this.mediaRecorder.onstop = () => {

      const audioBlob = new Blob(
        this.audioChunks,
        {
          type:
            this.mediaRecorder?.mimeType ||
            'audio/webm',
        },
      );

      console.log(
        'Audio enregistré :',
        audioBlob,
      );

      console.log(
        'Taille :',
        audioBlob.size,
        'octets',
      );

      this.releaseMicrophone();
    };

    this.mediaRecorder.start();

    this.isRecording.set(true);

    this.voiceMessage.set(
      'Écoute en cours… Cliquez à nouveau pour arrêter.',
    );

  } catch (error) {

    console.error(
      'Erreur microphone :',
      error,
    );

    this.voiceMessage.set(
      "Impossible d'accéder au microphone. Vérifiez les autorisations du navigateur.",
    );
  }
  }

  private stopVoiceRecording(): void {

    if (
      !this.mediaRecorder ||
      this.mediaRecorder.state === 'inactive'
    ) {
      return;
    }

    this.mediaRecorder.stop();

    this.isRecording.set(false);

    this.voiceMessage.set(
      'Enregistrement terminé.',
    );
  }

  private releaseMicrophone(): void {

    this.microphoneStream
      ?.getTracks()
      .forEach((track) => track.stop());

    this.microphoneStream = undefined;
  }

  
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
      "J'ai perdu mon passeport sénégalais et je souhaite savoir comment le remplacer.",
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