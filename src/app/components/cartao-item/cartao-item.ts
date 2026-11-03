import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Moeda } from '../../pipes/moeda.pipe';
import { disponibilidadeItem, ItemCatalogo } from '../../services/catalogo.service';

@Component({
  selector: 'app-cartao-item',
  imports: [RouterLink, Moeda],
  templateUrl: './cartao-item.html',
  styleUrl: './cartao-item.css',
})
export class CartaoItem {
  readonly item = input.required<ItemCatalogo>();
  readonly adicionar = output<ItemCatalogo>();

  protected readonly situacao = computed(() => disponibilidadeItem(this.item()));
}
