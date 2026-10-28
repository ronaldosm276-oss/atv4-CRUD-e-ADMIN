import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/api.config';
import { Categoria } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/Categorium`;

  listar() { return this.http.get<Categoria[]>(this.url); }
  obter(id: number) { return this.http.get<Categoria>(`${this.url}/${id}`); }
  criar(categoria: Categoria) { return this.http.post<Categoria>(this.url, categoria); }
  atualizar(id: number, categoria: Categoria) { return this.http.put<void>(`${this.url}/${id}`, categoria); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
