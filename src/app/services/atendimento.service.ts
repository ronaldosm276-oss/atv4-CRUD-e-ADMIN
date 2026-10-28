import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../utils/api.config';
import { Atendimento, AtendimentoEnvio } from '../models/models';
import { CodigoStatus } from '../models/status';

@Injectable({ providedIn: 'root' })
export class AtendimentoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/Atendimento`;

  listar() { return this.http.get<Atendimento[]>(this.url); }
  obter(id: number) { return this.http.get<Atendimento>(`${this.url}/${id}`); }
  criar(pedido: AtendimentoEnvio) { return this.http.post<AtendimentoEnvio>(this.url, pedido); }
  atualizar(id: number, pedido: AtendimentoEnvio) { return this.http.put<void>(`${this.url}/${id}`, pedido); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }

  filtrar(filtro: { idPessoa?: number; status?: string }) {
    let params = new HttpParams();
    if (filtro.idPessoa !== undefined) params = params.set('idPessoa', filtro.idPessoa);
    if (filtro.status) params = params.set('status', filtro.status);
    return this.http.get<Atendimento[]>(this.url, { params });
  }

  mudarStatus(id: number, status: CodigoStatus) {
    return this.http.put<void>(`${this.url}/${id}/status`, { status });
  }
}
