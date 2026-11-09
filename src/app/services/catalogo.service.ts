import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { Item, ProdutoLeitura } from '../models/models';
import { urlImagem } from '../utils/api.config';
import { CategoriaService } from './categoria.service';
import { EstoqueService } from './estoque.service';
import { ItemService } from './item.service';
import { ProdutoService } from './produto.service';

export interface ItemCatalogo {
  idItem: number;
  nome: string;
  descricao: string;
  idCategoria: number;
  categoria: string;
  tipo: 'P' | 'S';
  preco: number;
  unidade: string;
  estoque: number | null;
  imagemUrl: string | null;
}

export interface Disponibilidade {
  disponivel: boolean;
  texto: string;
}

export function disponibilidadeItem(item: ItemCatalogo): Disponibilidade {
  const estoque = item.estoque;
  if (estoque === null) return { disponivel: true, texto: 'Disponível' };
  return estoque > 0
    ? { disponivel: true, texto: `Em estoque: ${estoque}` }
    : { disponivel: false, texto: 'Indisponível' };
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly itens = inject(ItemService);
  private readonly produtos = inject(ProdutoService);
  private readonly estoques = inject(EstoqueService);
  private readonly categorias = inject(CategoriaService);

  carregar() {
    return forkJoin({
      itens: this.itens.listar(),
      produtos: this.produtos.listar(),
      estoque: this.estoques.listar(),
      categorias: this.categorias.listar(),
    }).pipe(
      map(({ itens, produtos, estoque, categorias }) => {
        const produtoPorId = new Map(produtos.map(p => [p.iditem, p] as const));
        const estoquePorId = new Map(estoque.map(e => [e.idItem, e.quantidadeEstoque] as const));
        const categoriaPorId = new Map(categorias.map(c => [c.idcategoria, c.categoria] as const));

        const catalogo: ItemCatalogo[] = [];
        for (const item of itens) {
          if (item.ativoProdutoServico !== 'S') continue;

          const categoria = categoriaPorId.get(item.idCategoria) ?? item.categoria ?? '';

          if (item.tipoItem === 'P') {
            const produto = produtoPorId.get(item.idItem);
            if (!produto) continue;
            catalogo.push(this.deProduto(item, categoria, produto, estoquePorId.get(item.idItem) ?? 0));
          } else {
            catalogo.push(this.deServico(item, categoria));
          }
        }

        catalogo.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        return { itens: catalogo, categorias };
      }),
    );
  }

  obter(id: number): Observable<ItemCatalogo> {
    return this.itens.obter(id).pipe(
      switchMap(item => {
        if (item.ativoProdutoServico !== 'S') {
          return throwError(
            () => new HttpErrorResponse({ status: 404, error: { mensagem: 'ITEM INDISPONÍVEL!' } }),
          );
        }

        const categoria = item.categoria ?? '';
        if (item.tipoItem !== 'P') return of(this.deServico(item, categoria));

        return forkJoin({
          produto: this.produtos.obter(id),
          estoque: this.estoques.obter(id).pipe(
            map(e => e.quantidadeEstoque),
            catchError((e: HttpErrorResponse) => (e.status === 404 ? of(0) : throwError(() => e))),
          ),
        }).pipe(map(({ produto, estoque }) => this.deProduto(item, categoria, produto, estoque)));
      }),
    );
  }

  private deProduto(item: Item, categoria: string, produto: ProdutoLeitura, estoque: number): ItemCatalogo {
    return {
      idItem: item.idItem,
      nome: item.item,
      descricao: item.descricaoItem,
      idCategoria: item.idCategoria,
      categoria,
      tipo: 'P',
      preco: produto.precoVenda,
      unidade: (produto.unidade ?? '').trim(),
      imagemUrl: urlImagem(item.imagemUrl),
      estoque,
    };
  }

  private deServico(item: Item, categoria: string): ItemCatalogo {
    return {
      idItem: item.idItem,
      nome: item.item,
      descricao: item.descricaoItem,
      idCategoria: item.idCategoria,
      categoria,
      tipo: 'S',
      preco: item.preco,
      unidade: '',
      imagemUrl: urlImagem(item.imagemUrl),
      estoque: null,
    };
  }
}
