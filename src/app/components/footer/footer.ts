import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  LucideX,
} from '@lucide/angular';

@Component({
  selector: 'app-footer',

  imports: [
    RouterLink,
    LucideX,
  ],

  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {

  // Contrôle l'affichage de la fenêtre "À propos".
  isAboutOpen = false;

  openAbout(): void {
    this.isAboutOpen = true;
  }

  closeAbout(): void {
    this.isAboutOpen = false;
  }
}