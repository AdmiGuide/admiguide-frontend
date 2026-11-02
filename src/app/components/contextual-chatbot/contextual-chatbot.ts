import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideMessageCircle,
  LucideMessageCircleMore,
  LucideX,
  LucideFileText,
  LucideSend,
  LucideChevronRight,
  LucideExternalLink,
} from '@lucide/angular';

import { ChatService } from '../../services/chat.service';
import {
  ChatMessage,
  ChatPage,
  ChatRequest,
  ChatSource,
} from '../../models/chat.model';

// Message affiché dans la conversation avec ses sources éventuelles.
interface MessageAffiche extends ChatMessage {
  sources?: ChatSource[];
}

interface SuggestionChat {
  label: string;
  question: string;
}

@Component({
  selector: 'app-contextual-chatbot',
  imports: [
    LucideMessageCircle,
    LucideMessageCircleMore,
    LucideX,
    LucideFileText,
    LucideSend,
    LucideChevronRight,
    LucideExternalLink,
  ],
  templateUrl: './contextual-chatbot.html',
  styleUrl: './contextual-chatbot.css',
})
export class ContextualChatbot {
  @Input({ required: true }) publicId!: string;
  @Input({ required: true }) page!: ChatPage;
  @Input() questionId?: number;

  @ViewChild('zoneMessages') zoneMessages?: ElementRef<HTMLElement>;
  @ViewChild('champQuestion') champQuestion?: ElementRef<HTMLTextAreaElement>;

  private readonly chatService = inject(ChatService);

  readonly ouvert = signal(false);
  readonly envoiEnCours = signal(false);
  readonly saisie = signal('');
  readonly erreur = signal('');
  readonly messages = signal<MessageAffiche[]>([]);

  // Après « Expliquer un terme », on demande le terme sans appeler l'IA.
  readonly attendTerme = signal(false);

  readonly titres: Record<ChatPage, string> = {
    PRECISIONS: 'Quelques précisions',
    RESULTAT: 'Votre orientation',
    SUIVI: 'Suivi de ma démarche',
  };

  readonly suggestions: Record<ChatPage, SuggestionChat[]> = {
    PRECISIONS: [
      {
        label: 'Expliquer un terme',
        question: '', // Cette suggestion déclenche une question locale.
      },
      {
        label: 'Pourquoi cette question ?',
        question: 'Pourquoi AdmiGuide me pose-t-il cette question complémentaire ?',
      },
      {
        label: "M'aider à répondre",
        question: 'Explique-moi les choix proposés sans décider à ma place.',
      },
    ],
    RESULTAT: [
      {
        label: 'Comprendre une pièce',
        question: 'À quoi servent les pièces mentionnées dans mon orientation ?',
      },
      {
        label: 'Vérifier un délai',
        question: 'Quel est le délai actuel de cette démarche ?',
      },
      {
        label: 'Trouver le service',
        question: 'Où se trouve le service administratif compétent ?',
      },
    ],
    SUIVI: [
      {
        label: 'Une pièce me manque',
        question: 'Il me manque une pièce indiquée dans mon orientation. À quoi sert-elle ?',
      },
      {
        label: 'Je bloque sur une étape',
        question: "Peux-tu m'expliquer une étape de mon suivi ?",
      },
      {
        label: 'Où me rendre ?',
        question: 'Où se trouve le service administratif compétent ?',
      },
    ],
  };

  basculer(): void {
    this.ouvert.update((valeur) => !valeur);
    this.erreur.set('');
    if (this.ouvert()) {
      this.mettreLeFocus();
    }
  }

  fermer(): void {
    this.ouvert.set(false);
  }

  // Une suggestion affiche d'abord une invitation à préciser le terme.
  choisirSuggestion(suggestion: SuggestionChat): void {
    if (this.envoiEnCours()) {
      return;
    }

    if (suggestion.label === 'Expliquer un terme') {
      this.attendTerme.set(true);
      this.saisie.set('');
      this.erreur.set('');
      this.mettreLeFocus();
      return;
    }

    this.envoyerQuestion(suggestion.question);
  }

  // Ouvre directement une explication à partir d'une icône « ? » de la page.
  ouvrirPourTerme(terme: string, questionId: number): void {
    if (!terme.trim() || !questionId || this.envoiEnCours()) {
      return;
    }

    this.questionId = questionId;
    this.ouvert.set(true);
    this.attendTerme.set(false);
    this.erreur.set('');
    this.messages.set([]);
    this.envoyerQuestion(`Que signifie « ${terme.trim()} » ?`, terme.trim());
  }

  actualiserSaisie(event: Event): void {
    this.saisie.set((event.target as HTMLTextAreaElement).value);
  }

  gererTouche(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.envoyerQuestion(this.saisie());
    }
  }

  envoyerQuestion(question: string, termeJuridique?: string): void {
    const texteSaisi = question.trim();
    if (!texteSaisi || this.envoiEnCours()) {
      return;
    }

    if (!this.publicId) {
      this.erreur.set('La situation administrative est introuvable.');
      return;
    }

    if (this.page === 'PRECISIONS' && !this.questionId) {
      this.erreur.set("Aucune question complémentaire n'est sélectionnée.");
      return;
    }

    // Pour une définition, l'IA reçoit une question ciblée, pas une demande de tableau.
    const rechercheDeTerme = this.attendTerme();
    const questionPourApi = rechercheDeTerme
      ? `Que signifie « ${texteSaisi} » dans ma question complémentaire ? Explique ce terme en une ou deux phrases simples, sans liste de démarches.`
      : texteSaisi;

    const historique: ChatMessage[] = this.messages()
      .slice(-6)
      .map(({ role, content }) => ({
        role,
        content: content.slice(0, 1500),
      }));

    const demande: ChatRequest = {
      page: this.page,
      question: questionPourApi.slice(0, 600),
      historique,
    };

    if (this.page === 'PRECISIONS') {
      demande.question_id = this.questionId;
      // Un terme provenant du bouton « ? » a déjà été reconnu dans le formulaire.
      if (termeJuridique) {
        demande.terme_juridique = termeJuridique;
      }
    }

    this.attendTerme.set(false);
    this.erreur.set('');
    this.saisie.set('');

    // La bulle affiche ce que la personne a saisi, sans reformulation technique.
    this.messages.update((liste) => [
      ...liste,
      { role: 'user', content: texteSaisi },
    ]);

    this.envoiEnCours.set(true);
    this.defilerEnBas();

    this.chatService.sendMessage(this.publicId, demande).subscribe({
      next: (resultat) => {
        this.messages.update((liste) => [
          ...liste,
          {
            role: 'assistant',
            // Nettoie l'affichage du Markdown simple renvoyé par le modèle.
            content: this.nettoyerReponse(resultat.reponse),
            sources: (resultat.sources ?? []).filter(
              (source) => /^https:\/\//i.test(source.url),
            ),
          },
        ]);
        this.envoiEnCours.set(false);
        this.defilerEnBas();
        this.mettreLeFocus();
      },
      error: (erreur: HttpErrorResponse) => {
        this.envoiEnCours.set(false);
        if (erreur.status === 404) {
          this.erreur.set("Cette situation n'est pas accessible.");
        } else if (erreur.status === 400) {
          this.erreur.set("La question n'a pas pu être traitée. Vérifiez le contexte.");
        } else if (erreur.status === 429 || erreur.status === 503) {
          this.erreur.set('Le service est momentanément indisponible. Réessayez plus tard.');
        } else {
          this.erreur.set('Une erreur est survenue. Vous pouvez réessayer.');
        }
        this.defilerEnBas();
      },
    });
  }

  // L'interface affiche du texte brut (sans insertion de HTML non fiable).
  // Cette conversion légère rend lisibles les titres, gras et tableaux Markdown.
  private nettoyerReponse(reponse: string): string {
    const lignes = reponse.replace(/\r\n?/g, '\n').split('\n');
    const sortie: string[] = [];

    for (const ligne of lignes) {
      const texte = ligne.trim();

      // Ignore les séparateurs de tableaux Markdown.
      if (/^\|[\s:|\-]+\|$/.test(texte) && texte.includes('-')) {
        continue;
      }

      if (texte.startsWith('|') && texte.endsWith('|')) {
        const cellules = texte.slice(1, -1).split('|').map((cellule) => cellule.trim());
        if (cellules.length === 2 && /^(terme|ce que ça signifie|signification)$/i.test(cellules[0])) {
          continue;
        }
        sortie.push(cellules.length === 2
          ? `${cellules[0]} : ${cellules[1]}`
          : cellules.join(' — '));
      } else {
        sortie.push(ligne);
      }
    }

    return sortie.join('\n')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/__(.*?)__/gs, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 ($2)')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private mettreLeFocus(): void {
    setTimeout(() => this.champQuestion?.nativeElement.focus(), 50);
  }

  private defilerEnBas(): void {
    setTimeout(() => {
      const element = this.zoneMessages?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }, 50);
  }
}
