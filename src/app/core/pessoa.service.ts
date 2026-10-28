import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { CrudService } from './crud.service';
import { Pessoa } from './models';

@Injectable({ providedIn: 'root' })
export class PessoaService extends CrudService<Pessoa> {
  constructor() { super('PessoaEndereco'); }

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
