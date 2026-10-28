import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/api.config';
import { Funcionario } from '../models/models';

@Injectable({ providedIn: 'root' })
export class FuncionarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/Funcionario`;

  listar() { return this.http.get<Funcionario[]>(this.url); }
  obter(id: number) { return this.http.get<Funcionario>(`${this.url}/${id}`); }
  criar(funcionario: Funcionario) { return this.http.post<Funcionario>(this.url, funcionario); }
  atualizar(id: number, funcionario: Funcionario) { return this.http.put<void>(`${this.url}/${id}`, funcionario); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
