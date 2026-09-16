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


// Filtres disponibles sur l'écran Historique.
type HistoryFilter = 'all' | 'senegal' | 'abroad';


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

  // Filtre actuellement sélectionné.
  readonly selectedFilter = signal<HistoryFilter>('all');


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
  // de la recherche et du filtre géographique.
  readonly filteredSituations = computed(() => {

    const search = this.searchTerm()
      .trim()
      .toLocaleLowerCase('fr');

    const filter = this.selectedFilter();


    return this.situations().filter((situation) => {

      // Vérifie si le titre correspond
      // au texte recherché.
      const matchesSearch =
        !search ||
        situation.titre
          .toLocaleLowerCase('fr')
          .includes(search);


      // Aucun filtre géographique.
      if (filter === 'all') {
        return matchesSearch;
      }


      /*
       * Le filtre utilise pays_application
       * et non pays_residence.
       *
       * pays_residence :
       * pays où habite l'utilisateur.
       *
       * pays_application :
       * pays où la démarche doit être effectuée.
       */
      const country =
        situation.pays_application
          ?.trim()
          .toLocaleLowerCase('fr');


      // Reconnaît le Sénégal même si l'API
      // renvoie un code pays ou un libellé.
      const isSenegal =
        country === 'sn' ||
        country === 'sénégal' ||
        country === 'senegal';


      // Démarches à effectuer au Sénégal.
      if (filter === 'senegal') {
        return matchesSearch && isSenegal;
      }


      // Démarches à effectuer à l'étranger.
      return (
        matchesSearch &&
        !!country &&
        !isSenegal
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


  // ================= FILTRAGE =================

  // Active le filtre sélectionné.
  setFilter(filter: HistoryFilter): void {

    this.selectedFilter.set(filter);
  }


  // ================= FORMATAGE =================

  // Transforme les codes pays utilisés par l'API
  // en libellés lisibles dans l'interface.
  formatApplicationCountry(
    country: string | null,
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


    // Si le backend renvoie déjà un nom de pays,
    // on l'affiche tel quel.
    return country;
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