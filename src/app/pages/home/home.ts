import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBriefcase,
  LucideFileText,
  LucideHeart,
  LucideShieldCheck,
} from '@lucide/angular';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideBriefcase,
    LucideFileText,
    LucideHeart,
    LucideShieldCheck,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home {

  // Exemples utilisés pour préremplir
  // le champ de description d'une situation.
  readonly examples = {
    passeport:
      "J'ai perdu mon passeport sénégalais. Je voudrais savoir par où commencer pour le remplacer.",

    retour:
      "Je vis à l'étranger et je prépare mon retour définitif au Sénégal avec mes effets personnels.",

    naissance:
      "Mon enfant est né à l'étranger. Je souhaite enregistrer sa naissance auprès des autorités sénégalaises.",

    deces:
      'Un membre de ma famille, fonctionnaire, est décédé. Je souhaite connaître les démarches pour les ayants droit.',
  };
}