import { Component, computed, input, output } from '@angular/core';
import { Moeda } from '../../pipes/moeda.pipe';
import { ItemCatalogo } from '../../services/catalogo.service';

@Component({
  selector: 'app-cartao-item',
  imports: [Moeda],
  templateUrl: './cartao-item.html',
  styleUrl: './cartao-item.css',
})
export class CartaoItem {
  readonly item = input.required<ItemCatalogo>();
  readonly adicionar = output<ItemCatalogo>();

  protected readonly disponivel = computed(() => {
    const estoque = this.item().estoque;
    return estoque === null || estoque > 0;
  });

  protected readonly disponibilidade = computed(() => {
    const estoque = this.item().estoque;
    if (estoque === null) return 'Disponível';
    return estoque > 0 ? `Em estoque: ${estoque}` : 'Indisponível';
  });
}
