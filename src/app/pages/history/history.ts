import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import {
  LucideArrowRight,
  LucideFileText,
  LucidePlus,
  LucideSearch,
} from '@lucide/angular';

import { AuthService } from '../../services/auth.service';
import { OrientationService } from '../../services/orientation.service';

import { SituationHistory } from '../../models/situation-history.model';

import { UserSidebar } from '../../components/user-sidebar/user-sidebar';


@Component({
  selector: 'app-history',

  imports: [
    RouterLink,
    UserSidebar,
    LucideArrowRight,
    LucideFileText,
    LucidePlus,
    LucideSearch,
  ],

  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History implements OnInit {

  // Service utilisé pour récupérer l'utilisateur connecté.
  readonly authService = inject(AuthService);

  // Service utilisé pour récupérer les situations depuis Django.
  private readonly orientationService = inject(
    OrientationService,
  );


  // ================= ÉTATS DE LA PAGE =================

  // Liste complète des situations retournées par l'API.
  readonly situations = signal<SituationHistory[]>([]);

  // Indique si l'historique est en cours de chargement.
  readonly isLoading = signal(false);

  // Contient un éventuel message d'erreur.
  readonly errorMessage = signal('');


  // ================= RECHERCHE ET FILTRES =================

  // Texte saisi dans le champ de recherche.
  readonly searchTerm = signal('');

  // ================= DONNÉES CALCULÉES =================

  // Récupère uniquement le prénom de l'utilisateur connecté.
  readonly firstName = computed(() => {
    const fullName =
      this.authService.currentUser()?.nom_complet;

    if (!fullName) {
      return '';
    }

    return fullName
      .trim()
      .split(/\s+/)[0];
  });

  // Retourne les situations après application
  // de la recherche.
  readonly filteredSituations = computed(() => {

    const search = this.searchTerm()
      .trim()
      .toLocaleLowerCase('fr');

    return this.situations().filter((situation) => {

      return (
        !search ||
        situation.titre
          .toLocaleLowerCase('fr')
          .includes(search)
      );
    });
  });


  // ================= INITIALISATION =================

  ngOnInit(): void {
    this.loadHistory();
  }


  // ================= CHARGEMENT DES DONNÉES =================

  // Récupère l'historique de l'utilisateur depuis Django.
  private loadHistory(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');


    this.orientationService
      .getHistory()
      .subscribe({

        next: (situations) => {

          // Enregistre les données reçues
          // dans le signal Angular.
          this.situations.set(situations);

          this.isLoading.set(false);
        },


        error: (error) => {

          console.error(
            'Erreur chargement historique :',
            error,
          );

          this.errorMessage.set(
            'Impossible de charger votre historique.',
          );

          this.isLoading.set(false);
        },
      });
  }


  // ================= RECHERCHE =================

  // Met à jour le texte recherché
  // lorsque l'utilisateur saisit dans le champ.
  updateSearch(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }


  // Formate la date Django dans un format français.
  formatDate(date: string): string {

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    ).format(
      new Date(date),
    );
  }
}