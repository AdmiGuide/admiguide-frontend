import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBriefcase,
  LucideFileText,
  LucideHouse,
  LucideShieldCheck,
} from '@lucide/angular';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideBriefcase,
    LucideFileText,
    LucideHouse,
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
      "J'ai perdu mon passeport et je souhaite savoir comment le remplacer.",

    bail:
      "J'occupe un terrain et je souhaite obtenir un bail.",

    acquisition:
      "Je souhaite acheter un terrain.",

    deces:
      "Un membre de ma famille est décédé et je souhaite connaître les démarches pour les ayants droit.",
  };
}