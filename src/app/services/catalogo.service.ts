import { inject, Injectable } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { CategoriaService } from './categoria.service';
import { EstoqueService } from './estoque.service';
import { ItemService } from './item.service';
import { ProdutoService } from './produto.service';

// visão única do que a loja vende: produto e serviço com o mesmo formato
export interface ItemCatalogo {
  idItem: number;
  nome: string;
  descricao: string;
  idCategoria: number;
  categoria: string;
  tipo: 'P' | 'S';
  preco: number;          // preço de venda (produto: precoVenda; serviço: item.preco)
  unidade: string;
  estoque: number | null; // null = serviço, que não tem estoque
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
        for (const i of itens) {
          if (i.ativoProdutoServico !== 'S') continue; // só ativos

          const base = {
            idItem: i.idItem,
            nome: i.item,
            descricao: i.descricaoItem,
            idCategoria: i.idCategoria,
            categoria: categoriaPorId.get(i.idCategoria) ?? i.categoria ?? '',
          };

          if (i.tipoItem === 'P') {
            const produto = produtoPorId.get(i.idItem);
            if (!produto) continue; // produto sem registro em produto: não dá para precificar
            catalogo.push({
              ...base,
              tipo: 'P',
              preco: produto.precoVenda,
              unidade: (produto.unidade ?? '').trim(),
              estoque: estoquePorId.get(i.idItem) ?? 0,
            });
          } else {
            catalogo.push({ ...base, tipo: 'S', preco: i.preco, unidade: '', estoque: null });
          }
        }

        catalogo.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        return { itens: catalogo, categorias };
      }),
    );
  }
}
