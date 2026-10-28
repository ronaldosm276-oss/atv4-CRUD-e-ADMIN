import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'loja' },
  { path: 'loja', loadChildren: () => import('./loja/loja.routes').then(m => m.LOJA_ROUTES) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  { path: '**', redirectTo: 'loja' },
];
