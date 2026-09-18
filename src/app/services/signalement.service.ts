import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  SignalementCreatePayload,
  SignalementCreateResponse,
} from '../models/signalement.model';

@Service()
export class SignalementService {
  private readonly http = inject(HttpClient);

  // Envoie un signalement lié à une orientation précise.
  create(
    publicId: string,
    payload: SignalementCreatePayload,
  ): Observable<SignalementCreateResponse> {
    return this.http.post<SignalementCreateResponse>(
      `${environment.apiUrl}/signalements/situations/${publicId}/`,
      payload,
    );
  }
}
