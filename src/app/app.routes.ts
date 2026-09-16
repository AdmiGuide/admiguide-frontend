import { Routes } from '@angular/router';

import { UserLayout } from './layouts/user-layout/user-layout';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Profile } from './pages/profile/profile';
import { History } from './pages/history/history';

import { authGuard } from './guards/auth-guard';
import { OrientationResult } from './pages/orientation-result/orientation-result';

export const routes: Routes = [
  {
    path: '',
    component: UserLayout,

    children: [
      // Page d'accueil.
      {
        path: '',
        component: Home,
      },

      // Authentification.
      {
        path: 'connexion',
        component: Login,
      },
      {
        path: 'inscription',
        component: Register,
      },

      // Résultat d'une orientation.
      {
        path: 'orientation/resultat/:publicId',
        component: OrientationResult,
      },

      // Redirige l'entrée de l'espace utilisateur
      // vers sa page principale : l'historique.
      {
        path: 'espace',
        redirectTo: 'espace/historique',
        pathMatch: 'full',
      },

      // Historique de l'utilisateur connecté.
      {
        path: 'espace/historique',
        component: History,
        canActivate: [authGuard],
      },

      // Profil de l'utilisateur connecté.
      {
        path: 'espace/profil',
        component: Profile,
        canActivate: [authGuard],
      },


    ],
  },
];