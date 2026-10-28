import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Item } from './models';

@Injectable({ providedIn: 'root' })
export class ItemService extends CrudService<Item> {
  constructor() { super('Item'); }
}
