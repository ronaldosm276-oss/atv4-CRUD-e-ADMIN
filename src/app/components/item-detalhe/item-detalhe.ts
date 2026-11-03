import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { Moeda } from '../../pipes/moeda.pipe';
import { CarrinhoService } from '../../services/carrinho.service';
import { CatalogoService, disponibilidadeItem, ItemCatalogo } from '../../services/catalogo.service';
import { MensagemService } from '../../services/mensagem.service';
import { mensagemErro } from '../../utils/util';

@Component({
  selector: 'app-item-detalhe',
  imports: [RouterLink, Moeda],
  templateUrl: './item-detalhe.html',
  styleUrl: './item-detalhe.css',
})
export class ItemDetalhe {
  private readonly rota = inject(ActivatedRoute);
  private readonly catalogo = inject(CatalogoService);
  private readonly carrinho = inject(CarrinhoService);
  private readonly mensagens = inject(MensagemService);

  protected readonly item = signal<ItemCatalogo | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly situacao = disponibilidadeItem;

  constructor() {
    this.rota.paramMap
      .pipe(
        tap(() => {
          this.carregando.set(true);
          this.erro.set(null);
          this.item.set(null);
        }),
        switchMap(params => {
          const id = Number(params.get('id'));
          if (!Number.isInteger(id) || id <= 0) {
            this.erro.set('Identificador inválido.');
            this.carregando.set(false);
            return EMPTY;
          }
          return this.catalogo.obter(id).pipe(
            catchError((e: HttpErrorResponse) => {
              this.erro.set(mensagemErro(e));
              this.carregando.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(item => {
        this.item.set(item);
        this.carregando.set(false);
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
