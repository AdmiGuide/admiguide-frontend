import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AdminUser } from '../models/admin-user.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { AdminSource } from '../models/admin-source.model';
import {
  AdminSignalement,
  AdminSignalementUpdate,
  SignalementStatus,
} from '../models/admin-signalement.model';

@Service()
export class AdminService {
  private readonly http = inject(HttpClient);

  // Récupère une page d'utilisateurs avec recherche et filtre.
  getUsers(
    page = 1,
    search = '',
    status: 'tous' | 'actif' | 'suspendu' = 'tous',
  ): Observable<PaginatedResponse<AdminUser>> {
    let params = new HttpParams().set(
      'page',
      page.toString(),
    );

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim(),
      );
    }

    if (status !== 'tous') {
      params = params.set(
        'status',
        status,
      );
    }

    return this.http.get<PaginatedResponse<AdminUser>>(
      `${environment.apiUrl}/auth/admin/users/`,
      { params },
    );
  }

  // Suspend ou réactive un compte utilisateur.
    updateUserStatus(
    userId: number,
    isActive: boolean,
    ): Observable<AdminUser> {
    return this.http.patch<AdminUser>(
        `${environment.apiUrl}/auth/admin/users/${userId}/`,
        {
        is_active: isActive,
        },
    );
    }

    // Récupère les sources officielles avec recherche et filtres.
    getSources(
      page = 1,
      search = '',
      statut = '',
      type = '',
    ): Observable<PaginatedResponse<AdminSource>> {
    let params = new HttpParams().set(
        'page',
        page.toString(),
    );

    if (search.trim()) {
        params = params.set(
        'search',
        search.trim(),
        );
    }

    if (statut) {
        params = params.set(
        'statut',
        statut,
        );
    }

    if (type) {
        params = params.set(
        'type',
        type,
        );
    }

    return this.http.get<PaginatedResponse<AdminSource>>(
        `${environment.apiUrl}/referentiel/admin/sources/`,
        { params },
    );
    }

    
  // Enregistre le contrôle manuel d'une source.
  updateSourceStatus(
    sourceId: number,
    statut: string,
  ): Observable<AdminSource> {
    return this.http.patch<AdminSource>(
      `${environment.apiUrl}/referentiel/admin/sources/${sourceId}/control/`,
      { statut },
    );
  }

  // Récupère les signalements avec recherche et filtre de statut.
  getSignalements(
    page = 1,
    search = '',
    statut: 'tous' | SignalementStatus = 'tous',
  ): Observable<PaginatedResponse<AdminSignalement>> {
    let params = new HttpParams().set(
      'page',
      page.toString(),
    );

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim(),
      );
    }

    if (statut !== 'tous') {
      params = params.set(
        'statut',
        statut,
      );
    }

    return this.http.get<PaginatedResponse<AdminSignalement>>(
      `${environment.apiUrl}/signalements/admin/`,
      { params },
    );
  }

  // Met à jour le statut ou le traitement d'un signalement.
  updateSignalement(
    signalementId: number,
    payload: AdminSignalementUpdate,
  ): Observable<AdminSignalement> {
    return this.http.patch<AdminSignalement>(
      `${environment.apiUrl}/signalements/admin/${signalementId}/`,
      payload,
    );
  }
}