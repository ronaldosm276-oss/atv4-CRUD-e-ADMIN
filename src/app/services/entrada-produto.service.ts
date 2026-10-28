import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/api.config';
import { EntradaEnvio, EntradaResposta } from '../models/models';

@Injectable({ providedIn: 'root' })
export class EntradaProdutoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/EntradaProduto`;

  listar() { return this.http.get<EntradaResposta[]>(this.url); }
  obter(id: number) { return this.http.get<EntradaResposta>(`${this.url}/${id}`); }
  criar(entrada: EntradaEnvio) { return this.http.post<EntradaEnvio>(this.url, entrada); }
  atualizar(id: number, entrada: EntradaEnvio) { return this.http.put<void>(`${this.url}/${id}`, entrada); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
