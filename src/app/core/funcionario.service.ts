import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Funcionario } from './models';

@Injectable({ providedIn: 'root' })
export class FuncionarioService extends CrudService<Funcionario> {
  constructor() { super('Funcionario'); }
}
