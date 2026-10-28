import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { ProdutoEnvio, ProdutoLeitura } from './models';

@Injectable({ providedIn: 'root' })
export class ProdutoService extends CrudService<ProdutoLeitura, ProdutoEnvio> {
  constructor() { super('ProdutoItem'); }
}
