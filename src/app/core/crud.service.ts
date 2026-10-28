import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';

// T = o que a API devolve no GET; E = o que ela recebe no POST/PUT
export abstract class CrudService<T, E = T> {
  protected readonly http = inject(HttpClient);
  protected readonly url: string;

  protected constructor(recurso: string) {
    this.url = `${API_URL}/${recurso}`;
  }

  listar() { return this.http.get<T[]>(this.url); }
  obter(id: number) { return this.http.get<T>(`${this.url}/${id}`); }
  criar(dto: E) { return this.http.post<E>(this.url, dto); }
  atualizar(id: number, dto: E) { return this.http.put<void>(`${this.url}/${id}`, dto); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
