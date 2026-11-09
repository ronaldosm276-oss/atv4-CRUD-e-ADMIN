import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/api.config';

export interface Atendente { idPessoa: number; nome: string; cargo: string; }

// lista minima e publica (sem CPF/e-mail/telefone) para o cliente escolher o atendente
@Injectable({ providedIn: 'root' })
export class AtendenteService {
  private readonly http = inject(HttpClient);
  listar() { return this.http.get<Atendente[]>(`${API_URL}/Funcionario/atendentes`); }
}