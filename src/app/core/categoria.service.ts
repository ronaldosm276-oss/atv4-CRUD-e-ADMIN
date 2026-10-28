import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Categoria } from './models';

@Injectable({ providedIn: 'root' })
export class CategoriaService extends CrudService<Categoria> {
  constructor() { super('Categorium'); }
}
