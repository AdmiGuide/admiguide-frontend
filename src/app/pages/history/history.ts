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
  // Donne accès à l'utilisateur actuellement connecté.
  readonly authService = inject(AuthService);

  // Récupère les situations depuis l'API Django.
  private readonly orientationService = inject(OrientationService);

  // États de la page.
  readonly situations = signal<SituationHistory[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  // États de recherche et de filtrage.
  readonly searchTerm = signal('');
  readonly selectedFilter = signal<HistoryFilter>('all');

  // Récupère uniquement le prénom pour le message de bienvenue.
  readonly firstName = computed(() => {
    const fullName = this.authService.currentUser()?.nom_complet;

    if (!fullName) {
      return '';
    }

    return fullName.trim().split(/\s+/)[0];
  });

  // Liste affichée après application de la recherche et du filtre.
  readonly filteredSituations = computed(() => {
    const search = this.searchTerm()
      .trim()
      .toLocaleLowerCase('fr');

    const filter = this.selectedFilter();

    return this.situations().filter((situation) => {
      // Recherche dans le titre de la situation.
      const matchesSearch =
        !search ||
        situation.titre
          .toLocaleLowerCase('fr')
          .includes(search);

      // Aucun filtre géographique.
      if (filter === 'all') {
        return matchesSearch;
      }

      const country = situation.pays_residence
        ?.trim()
        .toLocaleLowerCase('fr');

      const isSenegal =
        country === 'sénégal' ||
        country === 'senegal';

      // Situation associée à une résidence au Sénégal.
      if (filter === 'senegal') {
        return matchesSearch && isSenegal;
      }

      // Résidence située hors du Sénégal.
      return matchesSearch && !!country && !isSenegal;
    });
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  // Charge l'historique depuis Django.
  private loadHistory(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.orientationService.getHistory().subscribe({
      next: (situations) => {
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

  // Met à jour la recherche lors de la saisie.
  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  // Active le filtre sélectionné.
  setFilter(filter: HistoryFilter): void {
    this.selectedFilter.set(filter);
  }

  // Formate la date Django pour l'affichage français.
  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }
}