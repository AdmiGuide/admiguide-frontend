import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AdminUser } from '../models/admin-user.model';
import { PaginatedResponse } from '../models/paginated-response.model';

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
}