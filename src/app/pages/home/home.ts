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
      "J'occupe un terrain au Sénégal et je voudrais obtenir des papiers pour ce terrain. Comment faire ?",

    acquisition:
      "J'ai acheté une maison, mais les papiers officiels sont encore au nom de l'ancien propriétaire. Je veux les mettre à mon nom",

    deces:
      "Un membre de ma famille est décédé et je voudrais savoir comment récupérer sa pension.",
  };
}