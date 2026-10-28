import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/api.config';
import { ProdutoEnvio, ProdutoLeitura } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/ProdutoItem`;

  // o GET devolve a entidade (ProdutoLeitura); POST e PUT recebem o ProdutoDTO (ProdutoEnvio)
  listar() { return this.http.get<ProdutoLeitura[]>(this.url); }
  obter(id: number) { return this.http.get<ProdutoLeitura>(`${this.url}/${id}`); }
  criar(produto: ProdutoEnvio) { return this.http.post<ProdutoEnvio>(this.url, produto); }
  atualizar(id: number, produto: ProdutoEnvio) { return this.http.put<void>(`${this.url}/${id}`, produto); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
