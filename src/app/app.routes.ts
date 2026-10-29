import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'loja' },

  // Loja virtual
  {
    path: 'loja',
    loadComponent: () => import('./components/loja-layout/loja-layout').then(m => m.LojaLayout),
    children: [
      { path: '', loadComponent: () => import('./components/catalogo/catalogo').then(m => m.Catalogo) },
      { path: 'cadastro', loadComponent: () => import('./components/cadastro/cadastro').then(m => m.Cadastro) },
      { path: 'carrinho', loadComponent: () => import('./components/carrinho/carrinho').then(m => m.Carrinho) },
      { path: 'pedidos', loadComponent: () => import('./components/pedidos/pedidos').then(m => m.Pedidos) },
    ],
  },

  // Painel administrativo
  {
    path: 'admin',
    loadComponent: () => import('./components/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./components/admin-inicio/admin-inicio').then(m => m.AdminInicio),
      },
      {
        path: 'clientes',
        loadComponent: () => import('./components/admin-clientes/admin-clientes').then(m => m.AdminClientes),
      },
      {
        path: 'categorias',
        loadComponent: () => import('./components/admin-categorias/admin-categorias').then(m => m.AdminCategorias),
      },
      {
        path: 'produtos',
        loadComponent: () => import('./components/admin-produtos/admin-produtos').then(m => m.AdminProdutos),
      },
      {
        path: 'servicos',
        loadComponent: () => import('./components/admin-servicos/admin-servicos').then(m => m.AdminServicos),
      },
      {
        path: 'funcionarios',
        loadComponent: () => import('./components/admin-funcionarios/admin-funcionarios').then(m => m.AdminFuncionarios),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./components/admin-pedidos/admin-pedidos').then(m => m.AdminPedidos),
      },
      {
        path: 'entradas',
        loadComponent: () => import('./components/admin-entradas/admin-entradas').then(m => m.AdminEntradas),
      },
      {
        path: 'estoque',
        loadComponent: () => import('./components/admin-estoque/admin-estoque').then(m => m.AdminEstoque),
      },
    ],
  },

  { path: '**', redirectTo: 'loja' },
];
