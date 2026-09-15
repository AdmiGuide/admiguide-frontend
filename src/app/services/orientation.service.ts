import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { SituationHistory } from '../models/situation-history.model';

@Service()
export class OrientationService {
  // Permet d'effectuer les appels HTTP vers Django.
  private readonly http = inject(HttpClient);

  // Récupère l'historique de l'utilisateur connecté.
  getHistory(): Observable<SituationHistory[]> {
    return this.http.get<SituationHistory[]>(
      `${environment.apiUrl}/orientations/historique/`,
    );
  }
}