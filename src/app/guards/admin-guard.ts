import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

// Autorise uniquement les administrateurs
// à accéder à l'espace d'administration.
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // L'utilisateur est déjà chargé et c'est un administrateur.
  if (authService.isAdmin()) {
    return true;
  }

  // Un utilisateur est connecté mais n'est pas administrateur.
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/espace/historique']);
  }

  // Après actualisation, tente de restaurer la session.
  return authService.restoreSession().pipe(
    map((user) => {
      // Aucune session valide.
      if (!user) {
        return router.createUrlTree(['/connexion']);
      }

      // Administrateur autorisé.
      if (user.role === 'admin') {
        return true;
      }

      // Utilisateur normal : accès refusé à l'administration.
      return router.createUrlTree(['/espace/historique']);
    }),
  );
};