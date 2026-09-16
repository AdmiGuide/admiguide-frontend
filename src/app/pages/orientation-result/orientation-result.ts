import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import {
  LucideCheck,
  LucideExternalLink,
  LucideFileText,
  LucideFlag,
  LucideGlobe,
  LucidePlus,
} from '@lucide/angular';

import { OrientationService } from '../../services/orientation.service';
import { AuthService } from '../../services/auth.service';

import { OrientationResultData } from '../../models/orientation-result.model';


@Component({
  selector: 'app-orientation-result',

  imports: [
    RouterLink,
    LucideCheck,
    LucideExternalLink,
    LucideFileText,
    LucideFlag,
    LucideGlobe,
    LucidePlus,
  ],

  templateUrl: './orientation-result.html',
  styleUrl: './orientation-result.css',
})
export class OrientationResult implements OnInit {

  // Permet de lire le publicId présent dans l'URL.
  private readonly route = inject(ActivatedRoute);

  // Service utilisé pour récupérer l'orientation depuis Django.
  private readonly orientationService =
    inject(OrientationService);

  // Permet de connaître l'état de connexion de l'utilisateur.
  readonly authService = inject(AuthService);


  // ================= ÉTATS DE LA PAGE =================

  // Résultat complet de l'orientation.
  readonly result =
    signal<OrientationResultData | null>(null);

  // Indique si les données sont en cours de chargement.
  readonly isLoading = signal(true);

  // Contient un éventuel message d'erreur.
  readonly errorMessage = signal('');


  // ================= DONNÉES CALCULÉES =================

  // Premier service compétent utilisé
  // dans la carte récapitulative.
  readonly mainService = computed(() => {
    return (
      this.result()?.services_competents?.[0] ??
      null
    );
  });


  // ================= INITIALISATION =================

  ngOnInit(): void {

    // Récupère l'identifiant de la situation
    // depuis /orientation/resultat/:publicId.
    const publicId =
      this.route.snapshot.paramMap.get('publicId');


    if (!publicId) {
      this.errorMessage.set(
        'Cette orientation est introuvable.',
      );

      this.isLoading.set(false);

      return;
    }


    this.loadResult(publicId);
  }


  // ================= CHARGEMENT =================

  // Charge le résultat complet depuis Django.
  private loadResult(
    publicId: string,
  ): void {

    this.isLoading.set(true);
    this.errorMessage.set('');


    this.orientationService
      .getResult(publicId)
      .subscribe({

        next: (result) => {

          // Enregistre les données reçues
          // dans le signal Angular.
          this.result.set(result);

          this.isLoading.set(false);
        },


        error: (error: HttpErrorResponse) => {

          console.error(
            'Erreur chargement orientation :',
            error,
          );


          // Une situation inexistante ou inaccessible
          // retourne normalement une erreur 404.
          if (error.status === 404) {

            this.errorMessage.set(
              'Cette orientation est introuvable ou inaccessible.',
            );

          } else {

            this.errorMessage.set(
              'Impossible de charger votre orientation pour le moment.',
            );
          }


          this.isLoading.set(false);
        },
      });
  }


  // ================= FORMATAGE =================

  // Remplace une information vide par
  // un message neutre pour l'utilisateur.
  displayValue(
    value?: string | null,
  ): string {

    return value?.trim()
      ? value
      : 'À confirmer auprès du service';
  }


  // Transforme les codes pays renvoyés par Django
  // en noms lisibles dans l'interface.
  formatCountry(
    country?: string | null,
  ): string {

    if (!country) {
      return '';
    }


    const normalizedCountry =
      country
        .trim()
        .toUpperCase();


    if (normalizedCountry === 'SN') {
      return 'Sénégal';
    }


    if (normalizedCountry === 'FR') {
      return 'France';
    }


    return country;
  }
}