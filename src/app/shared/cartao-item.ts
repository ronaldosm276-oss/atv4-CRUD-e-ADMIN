import { Component, computed, input, output } from '@angular/core';
import { ItemCatalogo } from '../core/catalogo.service';
import { Moeda } from './moeda';

@Component({
  selector: 'app-cartao-item',
  imports: [Moeda],
  template: `
    <article class="cartao">
      <span class="etiqueta">{{ item().tipo === 'P' ? 'Produto' : 'Serviço' }} · {{ item().categoria }}</span>
      <h3>{{ item().nome }}</h3>
      <p class="descricao">{{ item().descricao }}</p>
      <p class="preco">
        {{ item().preco | moeda }}
        @if (item().unidade) { <small>/ {{ item().unidade }}</small> }
      </p>
      <p class="disponibilidade" [class.sem]="!disponivel()">{{ disponibilidade() }}</p>
      <button type="button" [disabled]="!disponivel()" (click)="adicionar.emit(item())">Adicionar</button>
    </article>
  `,
  styles: `
    .cartao { display: flex; flex-direction: column; gap: .4rem; height: 100%; padding: 1rem;
      background: var(--papel); border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, .15); }
    .etiqueta { font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; color: #5b6b66; }
    h3 { margin: 0; font-size: 1.05rem; }
    .descricao { flex: 1; margin: 0; font-size: .9rem; color: #44524e; }
    .preco { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .preco small { font-weight: 400; color: #5b6b66; }
    .disponibilidade { margin: 0; font-size: .85rem; color: #2e7d32; }
    .disponibilidade.sem { color: var(--erro); }
    button { padding: .55rem; border: 0; border-radius: 4px; background: var(--verde); color: #fff; cursor: pointer; }
    button:disabled { background: #9aa6a2; cursor: not-allowed; }
  `,
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
