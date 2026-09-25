import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import {
  LucideArrowLeft,
  LucideArrowRight,
} from '@lucide/angular';

import { OrientationService } from '../../services/orientation.service';
import { AuthService } from '../../services/auth.service';
import { OrientationQuestion } from '../../models/orientation-request.model';
import { COUNTRIES } from '../../data/countries';
import { Subscription } from 'rxjs';
import { OrientationLoading } from '../../components/orientation-loading/orientation-loading';

@Component({
  selector: 'app-orientation-precisions',

  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideArrowRight,
    OrientationLoading,
  ],

  templateUrl: './orientation-precisions.html',
  styleUrl: './orientation-precisions.css',
})
export class OrientationPrecisions implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly orientationService =
    inject(OrientationService);

  private readonly authService =
    inject(AuthService);

  private analysisSubscription?: Subscription;

  // Liste des pays déjà utilisée ailleurs dans AdmiGuide.
  readonly countries = COUNTRIES;

  // Pays de résidence associé à la situation.
  readonly paysResidence = signal('');

  // Identifiant d'une éventuelle question IA sur le pays.
  private readonly countryQuestionId =
    signal<number | null>(null);

  // Identifiant public de la situation.
  private publicId = '';


  // Description initiale.
  readonly description = signal('');


  // Questions retournées par Django.
  readonly questions =
    signal<OrientationQuestion[]>([]);


  // Réponses : question_id → contenu.
  readonly answers =
    signal<Record<number, string>>({});


  readonly isLoading =
    signal(true);

  readonly isSubmitting =
    signal(false);

  readonly errorMessage =
    signal('');


  ngOnInit(): void {

    const publicId =
      this.route.snapshot.paramMap.get(
        'publicId',
      );


    if (!publicId) {

      this.errorMessage.set(
        'Cette situation est introuvable.',
      );

      this.isLoading.set(false);

      return;
    }


    this.publicId = publicId;


    // Récupère la description conservée
    // après la première étape.
    const savedDescription =
      sessionStorage.getItem(
        `admiguide_situation_${publicId}`,
      );

    this.description.set(
      savedDescription ?? '',
    );

    // Préremplit le pays avec celui du profil
    // lorsque l'utilisateur est connecté.
    const residence =
      this.authService.currentUser()?.pays_residence;

    if (residence) {
      this.paysResidence.set(residence);
    }
    this.loadQuestions();
  }


  // Charge les questions complémentaires.
  private loadQuestions(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');


    this.orientationService
      .getQuestions(this.publicId)
      .subscribe({

        next: (questions) => {
          const countryQuestion =
            questions.find(
              (question) =>
                this.isCountryQuestion(question),
            );

          this.countryQuestionId.set(
            countryQuestion?.id ?? null,
          );
          
          const otherQuestions =
            questions.filter(
              (question) =>
                !this.isCountryQuestion(question),
            );

          this.questions.set(
            [...otherQuestions].sort(
              (a, b) => a.ordre - b.ordre,
            ),
          );
          this.isLoading.set(false);
        },


        error: (
          error: HttpErrorResponse,
        ) => {

          console.error(
            'Erreur chargement questions :',
            error,
          );

          this.errorMessage.set(
            'Impossible de charger les précisions demandées.',
          );

          this.isLoading.set(false);
        },
      });
  }


  // Identifie une éventuelle question IA sur le pays
  // pour éviter de l'afficher en double.
  isCountryQuestion(
    question: OrientationQuestion,
  ): boolean {

    const texte =
      question.texte
        .trim()
        .toLocaleLowerCase('fr');

    return (
      texte.includes('pays') &&
      (
        texte.includes('résid') ||
        texte.includes('resid')
      )
    );
  }

  // Enregistre le pays de résidence sélectionné.
  onCountryChange(event: Event): void {

    const select =
      event.target as HTMLSelectElement;

    this.paysResidence.set(
      select.value,
    );

    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }


  // Retourne la réponse actuelle.
  answerFor(
    questionId: number,
  ): string {

    return (
      this.answers()[questionId] ?? ''
    );
  }


  // Enregistre localement une réponse.
  setAnswer(
    questionId: number,
    value: string,
  ): void {

    this.answers.update(
      (current) => ({
        ...current,
        [questionId]: value,
      }),
    );

    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }


  // Utilisé par les input et select.
  onAnswerInput(
    questionId: number,
    event: Event,
  ): void {

    const element =
      event.target as
      | HTMLInputElement
      | HTMLSelectElement;

    this.setAnswer(
      questionId,
      element.value,
    );
  }


  // Classes visuelles d'un choix radio.
  choiceClasses(
    questionId: number,
    option: string,
  ): string {

    const selected =
      this.answerFor(questionId) ===
      option;


    return selected
      ? 'border-terracotta bg-terracotta/5'
      : 'border-linen bg-white/80';
  }


  // Envoie toutes les réponses à Django.
  submitAnswers(): void {

    if (this.isSubmitting()) {
      return;
    }

      // Le pays de résidence est obligatoire.
    if (!this.paysResidence().trim()) {

      this.errorMessage.set(
        'Sélectionnez votre pays de résidence.',
      );

      return;
    }
    const unanswered =
      this.questions().some(
        (question) =>
          !this.answerFor(
            question.id,
          ).trim(),
      );


    if (unanswered) {

      this.errorMessage.set(
        'Répondez à toutes les questions avant de continuer.',
      );

      return;
    }


    const reponses =
      this.questions().map(
        (question) => ({
          question_id: question.id,

          contenu:
            this.answerFor(
              question.id,
            ).trim(),
        }),
      );

      const countryQuestionId =
        this.countryQuestionId();

      if (countryQuestionId !== null) {
        reponses.unshift({
          question_id: countryQuestionId,
          contenu: this.paysResidence().trim(),
        });
      }


    this.isSubmitting.set(true);
    this.errorMessage.set('');


    this.analysisSubscription =
      this.orientationService
        .submitAnswers(
          this.publicId,
          {
            pays_residence:
              this.paysResidence().trim(),

            reponses,
          },
        )
        .subscribe({

          next: (response) => {

            this.isSubmitting.set(false);


            // Orientation obtenue.
            if (
              response.analyse.statut ===
              'ORIENTATION'
            ) {

              this.router.navigate([
                '/orientation/resultat',
                this.publicId,
              ]);

              return;
            }


            // L'IA peut demander une autre précision.
            if (
              response.analyse.statut ===
              'PRECISIONS_REQUISES'
            ) {

              this.answers.set({});

              this.loadQuestions();

              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              });

              return;
            }


            // Aucun résultat suffisamment fiable.
            if (
              response.analyse.statut ===
              'SOURCES_INSUFFISANTES'
            ) {

              sessionStorage.setItem(
                `admiguide_insuffisant_${this.publicId}`,
                response.analyse.message ?? '',
              );

              this.router.navigate([
                '/orientation/sources-insuffisantes',
                this.publicId,
              ]);

              return;
            }


            this.errorMessage.set(
              'La réponse reçue est invalide.',
            );
          },


          error: (
            error: HttpErrorResponse,
          ) => {

            console.error(
              'Erreur envoi réponses :',
              error,
            );

            this.isSubmitting.set(false);

            this.errorMessage.set(
              "Impossible d'analyser vos réponses pour le moment.",
            );
          },
        });
  }

  // Annule uniquement l'analyse en cours.
  // Les réponses saisies restent conservées.
  cancelAnalysis(): void {

    this.analysisSubscription?.unsubscribe();

    this.isSubmitting.set(false);
  }
}