import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/api.config';
import { Item } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/Item`;

  listar() { return this.http.get<Item[]>(this.url); }
  obter(id: number) { return this.http.get<Item>(`${this.url}/${id}`); }
  criar(item: Item) { return this.http.post<Item>(this.url, item); }
  atualizar(id: number, item: Item) { return this.http.put<void>(`${this.url}/${id}`, item); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
