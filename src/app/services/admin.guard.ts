import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessaoService } from './sessao.service';

export const adminGuard: CanActivateFn = (_rota, estado) => {
  if (inject(SessaoService).ehFuncionario()) return true;
  return inject(Router).createUrlTree(['/loja/entrar'], { queryParams: { retorno: estado.url } });
};