import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { EstoqueResposta } from './models';

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/Estoque`;

  listar() { return this.http.get<EstoqueResposta[]>(this.url); }
  obter(idItem: number) { return this.http.get<EstoqueResposta>(`${this.url}/${idItem}`); }
}
