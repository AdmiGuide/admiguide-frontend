import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
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
export class OrientationSourcesInsuffisantes
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  // Message métier renvoyé par l'analyse.
  readonly message = signal('');

  ngOnInit(): void {

    const publicId =
      this.route.snapshot.paramMap.get(
        'publicId',
      );

    if (!publicId) {
      return;
    }

    const message = sessionStorage.getItem(
      `admiguide_insuffisant_${publicId}`,
    );

    this.message.set(
      message?.trim() ?? '',
    );
  }
}