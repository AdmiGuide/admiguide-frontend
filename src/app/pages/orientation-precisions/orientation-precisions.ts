import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
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
  LucideCircleHelp 
} from '@lucide/angular';

import { OrientationService } from '../../services/orientation.service';
import { OrientationQuestion } from '../../models/orientation-request.model';
import { Subscription } from 'rxjs';
import { OrientationLoading } from '../../components/orientation-loading/orientation-loading';
import { ContextualChatbot } from '../../components/contextual-chatbot/contextual-chatbot';
@Component({
  selector: 'app-orientation-precisions',

  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideArrowRight,
    LucideCircleHelp,
    OrientationLoading,
    ContextualChatbot,
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

  private analysisSubscription?: Subscription;

  // Identifiant public transmis au chatbot.
  publicId = '';

  // Question actuellement associée au chatbot.
  readonly activeQuestionId = signal<number | undefined>(undefined);

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

  
  // Permet d'ouvrir le chatbot depuis les icônes d'aide.
  @ViewChild(ContextualChatbot)
  private chatbot?: ContextualChatbot;

  // Expressions administratives nécessitant une aide.
  // Nous pourrons enrichir cette liste progressivement.
  private readonly motifTermesComplexes =
    /(?<!\p{L})(?:autorisation d['’]occupation|état des droits réels|droits réels|titre foncier|jugement d['’]hérédité|certificat de non-opposition|capital[-‑ ]décès|ayant droit|réversion|usufruit|mutation|régularisation|cadastre|bail)(?!\p{L})/giu;

  // Découpe une question pour identifier les termes
  // à côté desquels afficher l'icône d'aide.
  segmentsAide(
    texte: string,
  ): { texte: string; terme?: string }[] {

    const segments: {
      texte: string;
      terme?: string;
    }[] = [];

    let position = 0;

    for (
      const correspondance of texte.matchAll(
        this.motifTermesComplexes,
      )
    ) {
      const debut = correspondance.index;
      const terme = correspondance[0];

      // Conserve le texte avant le terme complexe.
      if (debut > position) {
        segments.push({
          texte: texte.slice(position, debut),
        });
      }

      // Identifie le terme nécessitant une aide.
      segments.push({
        texte: terme,
        terme,
      });

      position = debut + terme.length;
    }

    // Conserve le texte restant.
    if (position < texte.length) {
      segments.push({
        texte: texte.slice(position),
      });
    }

    return segments.length
      ? segments
      : [{ texte }];
  }

  // Recherche un terme complexe dans une option.
  termeComplexe(option: string): string | null {
    return option.match(
      this.motifTermesComplexes,
    )?.[0] ?? null;
  }

  // Ouvre le chatbot sur le terme choisi.
  ouvrirAideTerme(
    questionId: number,
    terme: string,
  ): void {

    // Associe l'aide à la bonne question Django.
    this.activeQuestionId.set(questionId);

    // Ouvre le chatbot et demande une explication.
    this.chatbot?.ouvrirPourTerme(
      terme,
      questionId,
    );
  }

  
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

    this.loadQuestions();
  }


  // Charge les questions complémentaires.
  private loadQuestions(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Réinitialise la question associée au chatbot.
    this.activeQuestionId.set(undefined);

    this.orientationService
      .getQuestions(this.publicId)
      .subscribe({

        next: (questions) => {

          // Trie les questions selon leur ordre.
          const questionsTriees = [...questions].sort(
            (a, b) => a.ordre - b.ordre,
          );

          // Enregistre les questions dans le signal.
          this.questions.set(questionsTriees);

          // Associe le chatbot à la première question.
          this.activeQuestionId.set(
            questionsTriees[0]?.id,
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

    // Associe le chatbot à la question utilisée.
    this.activeQuestionId.set(questionId);

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


    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.analysisSubscription =
      this.orientationService
      .submitAnswers(
        this.publicId,
        {
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