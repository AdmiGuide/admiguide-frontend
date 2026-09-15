import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  throwError,
} from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const accessToken = authService.getAccessToken();

  // Les routes d'authentification n'ont pas besoin du Bearer token.
  const isAuthRequest =
    req.url.includes('/auth/login/') ||
    req.url.includes('/auth/register/') ||
    req.url.includes('/auth/refresh/');

  const request =
    accessToken && !isAuthRequest
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const refreshToken = authService.getRefreshToken();

      // Tente un refresh uniquement après un 401 pertinent.
      const canRefresh =
        error.status === 401 &&
        !!refreshToken &&
        !req.url.includes('/auth/login/') &&
        !req.url.includes('/auth/refresh/');

      if (!canRefresh) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((newAccessToken) => {
          // Rejoue la requête avec le nouvel access token.
          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          return next(retryRequest);
        }),

        catchError((refreshError) => {
          // Le refresh token n'est plus valide.
          authService.clearSession();

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};