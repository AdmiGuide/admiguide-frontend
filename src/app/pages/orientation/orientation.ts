import {
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideFileText,
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
    LucideMic,
    OrientationLoading,
    OrientationError,
  ],

  templateUrl: './orientation.html',
  styleUrl: './orientation.css',
})
export class Orientation implements OnDestroy {
  // Indique que l'audio est en cours
  // de nettoyage et de transcription.
  readonly isTranscribing = signal(false);

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

  readonly maxRecordingSeconds = 120;

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

  // Durée de l'enregistrement vocal en secondes.
  readonly recordingSeconds = signal(0);

  // Timer utilisé pendant l'enregistrement.
  private recordingTimer?: ReturnType<typeof setInterval>;

  // Enregistreur audio du navigateur.
  private mediaRecorder?: MediaRecorder;

  // Flux provenant du microphone.
  private microphoneStream?: MediaStream;

  // Morceaux audio reçus pendant l'enregistrement.
  private audioChunks: Blob[] = [];

  async toggleVoiceRecording(): Promise<void> {

    // Empêche de lancer un nouvel enregistrement
    // pendant la transcription du précédent.
    if (this.isTranscribing()) {
      return;
    }

    // Un deuxième clic arrête l'enregistrement.
    if (this.isRecording()) {
      this.stopVoiceRecording();
      return;
    }

    await this.startVoiceRecording();
  }

  private async startVoiceRecording(): Promise<void> {

  try {

    this.voiceMessage.set('');

    // Demande l'accès au microphone avec
    // les traitements audio proposés par le navigateur.
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

    // Réinitialise les morceaux d'un ancien enregistrement.
    this.audioChunks = [];

    // Crée l'enregistreur à partir du flux du microphone.
    this.mediaRecorder =
      new MediaRecorder(stream);

    // Conserve les morceaux audio reçus
    // pendant l'enregistrement.
    this.mediaRecorder.ondataavailable =
      (event: BlobEvent) => {

        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

    // Lorsque l'utilisateur arrête l'enregistrement.
    this.mediaRecorder.onstop = () => {

      // Arrête le minuteur même si MediaRecorder
      // s'est arrêté autrement que par un clic.
      this.stopRecordingTimer();

      // Regroupe tous les morceaux dans
      // un seul fichier audio.
      const audioBlob = new Blob(
        this.audioChunks,
        {
          type:
            this.mediaRecorder?.mimeType ||
            'audio/webm',
        },
      );

      // Libère le microphone.
      this.releaseMicrophone();

      // Vérifie que l'enregistrement contient
      // réellement des données.
      if (audioBlob.size === 0) {

        this.voiceMessage.set(
          "Aucun son n'a été enregistré. Veuillez réessayer.",
        );

        return;
      }

      this.isTranscribing.set(true);

      this.voiceMessage.set(
        'Préparation et transcription de votre enregistrement…',
      );

      // Envoie l'enregistrement à Django.
      // Django le transmet ensuite au microservice IA
      // pour le nettoyage et la transcription.
      this.orientationService
        .transcribeAudio(audioBlob)
        .subscribe({

          next: (response) => {

            this.isTranscribing.set(false);

            // Insère automatiquement le texte transcrit
            // dans le champ "Votre situation".
            this.situation.set(
              response.transcription.slice(
                0,
                this.maxLength,
              ),
            );

            this.errorMessage.set('');

            this.voiceMessage.set(
              'Texte prêt. Vous pouvez le modifier.',
            );
          },

          error: (
            error: HttpErrorResponse,
          ) => {

            console.error(
              'Erreur transcription audio :',
              error,
            );

            this.isTranscribing.set(false);

            this.voiceMessage.set(
              'La transcription a échoué. Veuillez réessayer.',
            );
          },
        });
    };

    // Démarre réellement l'enregistrement.
    this.mediaRecorder.start();

    this.isRecording.set(true);

    this.startRecordingTimer();

    this.voiceMessage.set(
      'Écoute en cours… Cliquez à nouveau pour arrêter.',
    );

  } catch (error) {

    console.error(
      'Erreur microphone :',
      error,
    );

    this.isRecording.set(false);

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

    this.stopRecordingTimer();

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


  private startRecordingTimer(): void {

    // Chaque nouvelle dictée recommence à 00:00.
    this.recordingSeconds.set(0);

    this.recordingTimer = setInterval(() => {

      this.recordingSeconds.update(
        (seconds) => seconds + 1,
      );

      // Arrête automatiquement la dictée à 2 minutes.
      if (
        this.recordingSeconds() >=
        this.maxRecordingSeconds
      ) {
        this.stopVoiceRecording();
      }

    }, 1000);
  }


  private stopRecordingTimer(): void {

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = undefined;
    }
  }


  formatRecordingTime(
    totalSeconds: number = this.recordingSeconds(),
  ): string {

      const minutes =
        Math.floor(totalSeconds / 60);

      const seconds =
        totalSeconds % 60;

      return (
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`
      );
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

  ngOnDestroy(): void {

    // Annule une éventuelle analyse HTTP en cours.
    this.analysisSubscription?.unsubscribe();

    // Arrête le minuteur de la dictée.
    this.stopRecordingTimer();

    // Si l'utilisateur quitte la page pendant
    // l'enregistrement, on évite de déclencher
    // la transcription automatiquement.
    if (
      this.mediaRecorder &&
      this.mediaRecorder.state !== 'inactive'
    ) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }

    // Libère l'accès au microphone.
    this.releaseMicrophone();
  }
}

