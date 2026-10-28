import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarrinhoService } from '../../services/carrinho.service';
import { CatalogoService, ItemCatalogo } from '../../services/catalogo.service';
import { MensagemService } from '../../services/mensagem.service';
import { Categoria } from '../../models/models';
import { mensagemErro } from '../../utils/util';
import { CartaoItem } from '../cartao-item/cartao-item';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, CartaoItem],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  private readonly catalogo = inject(CatalogoService);
  private readonly carrinho = inject(CarrinhoService);
  private readonly mensagens = inject(MensagemService);
  private readonly rota = inject(ActivatedRoute);

  protected readonly itens = signal<ItemCatalogo[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly busca = signal('');

  // categoria e tipo vêm da URL (/loja?categoria=1&tipo=P), então os links do menu funcionam
  private readonly params = toSignal(this.rota.queryParamMap, { initialValue: this.rota.snapshot.queryParamMap });
  protected readonly idCategoria = computed(() => Number(this.params().get('categoria')) || 0);
  protected readonly tipo = computed(() => {
    const t = this.params().get('tipo');
    return t === 'P' || t === 'S' ? t : '';
  });

  protected readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const categoria = this.idCategoria();
    const tipo = this.tipo();
    return this.itens().filter(
      i =>
        (!categoria || i.idCategoria === categoria) &&
        (!tipo || i.tipo === tipo) &&
        (!termo || i.nome.toLowerCase().includes(termo)),
    );
  });

  constructor() {
    this.carregar();
  }

  protected carregar() {
    this.carregando.set(true);
    this.erro.set(null);
    this.catalogo.carregar().subscribe({
      next: resultado => {
        this.itens.set(resultado.itens);
        this.categorias.set(resultado.categorias);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erro.set(mensagemErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected adicionar(item: ItemCatalogo) {
    const resultado = this.carrinho.adicionar(item);
    if (resultado.ok) {
      this.mensagens.sucesso(resultado.mensagem);
    } else {
      this.mensagens.erro(resultado.mensagem);
    }
  }
}
