import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout').then(m => m.AdminLayout),
    children: [], // as páginas da Etapa 4 entram aqui
  },
];
