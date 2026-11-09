import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { LoginResposta } from '../models/auth';
import { API_URL } from '../utils/api.config';
import { SessaoService } from './sessao.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessao = inject(SessaoService);

  login(login: string, senha: string) {
    return this.http
      .post<LoginResposta>(`${API_URL}/Auth/login`, { login: login.trim(), senha })
      .pipe(tap(r => this.sessao.iniciar(r)));
  }

  alterarSenha(senhaAtual: string, novaSenha: string) {
    return this.http.post<void>(`${API_URL}/Auth/alterar-senha`, { senhaAtual, novaSenha });
  }
}