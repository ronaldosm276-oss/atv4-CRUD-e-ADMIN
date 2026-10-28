import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { EntradaEnvio, EntradaResposta } from './models';

@Injectable({ providedIn: 'root' })
export class EntradaProdutoService extends CrudService<EntradaResposta, EntradaEnvio> {
  constructor() { super('EntradaProduto'); }
}
