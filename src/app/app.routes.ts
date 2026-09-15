import { Routes } from '@angular/router';
import { UserLayout } from './layouts/user-layout/user-layout';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { UserSpace } from './pages/user-space/user-space';
import { authGuard } from './guards/auth-guard';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
  {
    path: '',
    component: UserLayout,
    children: [
      {
        path: '',
        component: Home,
      },
      {
        path: 'connexion',
        component: Login,
      },
      {
        path: 'inscription',
        component: Register,
      },
      {
        path: 'espace',
        component: UserSpace,
        canActivate: [authGuard],
      },
      {
      path: 'espace/profil',
      component: Profile,
      canActivate: [authGuard],
      },
    ],
  },
];
