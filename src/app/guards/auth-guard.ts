import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

// Vérifie qu'un utilisateur est connecté
// avant d'autoriser l'accès à une route privée.
export const authGuard: CanActivateFn = () => {
  // Accès aux informations d'authentification.
  const authService = inject(AuthService);

  // Permet de rediriger l'utilisateur si nécessaire.
  const router = inject(Router);

  // L'utilisateur est déjà chargé en mémoire.
  if (authService.isAuthenticated()) {
    return true;
  }

  // Aucun token disponible : l'utilisateur n'est pas connecté.
  if (
    !authService.getAccessToken() &&
    !authService.getRefreshToken()
  ) {
    return router.createUrlTree(['/connexion']);
  }

  // Un token existe : on tente de restaurer la session.
  return authService.restoreSession().pipe(
    map((user) => {
      // Session restaurée avec succès.
      if (user) {
        return true;
      }

      // Session invalide ou expirée.
      return router.createUrlTree(['/connexion']);
    }),
  );
};