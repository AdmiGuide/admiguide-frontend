import {
  Component,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  LucideArrowRight,
  LucideSearch,
} from '@lucide/angular';


@Component({
  selector: 'app-orientation-sources-insuffisantes',

  imports: [
    RouterLink,
    LucideArrowRight,
    LucideSearch,
  ],

  templateUrl:
    './orientation-sources-insuffisantes.html',

  styleUrl:
    './orientation-sources-insuffisantes.css',
})
export class OrientationSourcesInsuffisantes {}