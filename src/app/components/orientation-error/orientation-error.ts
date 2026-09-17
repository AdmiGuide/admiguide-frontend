import {
  Component,
  output,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  LucideArrowRight,
  LucideFileText,
} from '@lucide/angular';


@Component({
  selector: 'app-orientation-error',

  imports: [
    RouterLink,
    LucideArrowRight,
    LucideFileText,
  ],

  templateUrl: './orientation-error.html',
  styleUrl: './orientation-error.css',
})
export class OrientationError {

  // Informe la page parente
  // que l'utilisateur souhaite réessayer.
  readonly retry =
    output<void>();


  retryAnalysis(): void {
    this.retry.emit();
  }
}