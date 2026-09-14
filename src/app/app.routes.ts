import { Routes } from '@angular/router';
import { UserLayout } from './layouts/user-layout/user-layout';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: UserLayout,
    children: [
      {
        path: '',
        component: Home,
      },
    ],
  },
];
