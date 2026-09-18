import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

// Autorise uniquement un utilisateur classique
// à accéder à son espace personnel.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // L'utilisateur est déjà chargé en mémoire.
  if (authService.isAuthenticated()) {
    // Un administrateur reste dans l'espace admin.
    if (authService.isAdmin()) {
      return router.createUrlTree(['/admin']);
    }

    return true;
  }

  // Aucun token : l'utilisateur doit se connecter.
  if (
    !authService.getAccessToken() &&
    !authService.getRefreshToken()
  ) {
    return router.createUrlTree(['/connexion']);
  }

  // Un token existe : on restaure la session.
  return authService.restoreSession().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/connexion']);
      }

      // Un administrateur ne doit pas accéder
      // à l'espace personnel utilisateur.
      if (user.role === 'admin') {
        return router.createUrlTree(['/admin']);
      }

      return true;
    }),
  );
};