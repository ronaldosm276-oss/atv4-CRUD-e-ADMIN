import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../utils/api.config';
import { MensagemService } from './mensagem.service';
import { SessaoService } from './sessao.service';

// anexa o token so nas chamadas da nossa API; 401 com token = sessao expirada
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessao = inject(SessaoService);
  const mensagens = inject(MensagemService);
  const router = inject(Router);

  if (!req.url.startsWith(API_URL)) return next(req);

  const token = sessao.token();
  const envio = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(envio).pipe(
    catchError((e: unknown) => {
      if (e instanceof HttpErrorResponse && e.status === 401 && token && !req.url.endsWith('/Auth/login')) {
        sessao.sair();
        mensagens.erro('Sua sessão expirou. Entre novamente.');
        router.navigate(['/loja/entrar']);
      }
      return throwError(() => e);
    }),
  );
};