import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { SituationHistory } from '../models/situation-history.model';
import { OrientationResultData } from '../models/orientation-result.model';


@Service()
export class OrientationService {
  // Client HTTP utilisé pour communiquer avec Django.
  private readonly http = inject(HttpClient);


  // Récupère le résultat complet d'une situation.
  getResult(
    publicId: string,
  ): Observable<OrientationResultData> {
    return this.http.get<OrientationResultData>(
      `${environment.apiUrl}/orientations/situations/${publicId}/resultat/`,
    );
  }


  // Récupère l'historique de l'utilisateur connecté.
  getHistory(): Observable<SituationHistory[]> {
    return this.http.get<SituationHistory[]>(
      `${environment.apiUrl}/orientations/historique/`,
    );
  }
}