import { Routes } from '@angular/router';

export const LOJA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./loja-layout').then(m => m.LojaLayout),
    children: [], // as páginas da Etapa 3 entram aqui
  },
];
