import { Routes } from '@angular/router';

export const LOJA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./loja-layout').then(m => m.LojaLayout),
    children: [
      { path: '', loadComponent: () => import('./catalogo/catalogo').then(m => m.Catalogo) },
      { path: 'cadastro', loadComponent: () => import('./cadastro/cadastro').then(m => m.Cadastro) },
      // carrinho e pedidos entram na próxima parte da Etapa 3
    ],
  },
];
