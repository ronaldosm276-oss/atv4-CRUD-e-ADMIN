import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { API_URL } from '../utils/api.config';
import { Pessoa } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PessoaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/PessoaEndereco`;

  listar() { return this.http.get<Pessoa[]>(this.url); }
  obter(id: number) { return this.http.get<Pessoa>(`${this.url}/${id}`); }
  criar(pessoa: Pessoa) { return this.http.post<Pessoa>(this.url, pessoa); }
  atualizar(id: number, pessoa: Pessoa) { return this.http.put<void>(`${this.url}/${id}`, pessoa); }
  excluir(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }

  // Não há filtro na API; isolado aqui para trocar por ?cpf=/?email= sem mexer nas telas.
  identificar(valor: string) {
    const v = valor.trim().toLowerCase();
    const cpf = Number(v.replace(/\D/g, ''));
    return this.listar().pipe(
      map(pessoas => pessoas.find(p =>
        v.includes('@') ? p.email.toLowerCase() === v : cpf > 0 && p.cpf === cpf) ?? null),
    );
  }
}
