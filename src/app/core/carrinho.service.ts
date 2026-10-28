import { computed, effect, Injectable, signal } from '@angular/core';
import { ItemCatalogo } from './catalogo.service';

export interface LinhaCarrinho {
  idItem: number;
  nome: string;
  tipo: 'P' | 'S';
  preco: number;
  quantidade: number;
  unidade: string;
  estoque: number | null; // limite de quantidade (só produto)
}

export interface ResultadoCarrinho { ok: boolean; mensagem: string; }

const CHAVE = 'minhaloja.carrinho';

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  readonly linhas = signal<LinhaCarrinho[]>(this.recuperar());
  readonly quantidadeTotal = computed(() => this.linhas().reduce((s, l) => s + l.quantidade, 0));
  readonly total = computed(() => this.linhas().reduce((s, l) => s + l.preco * l.quantidade, 0));

  constructor() {
    // o carrinho sobrevive ao F5; o pedido só vai ao banco quando o cliente confirma
    effect(() => this.guardar(this.linhas()));
  }

  adicionar(item: ItemCatalogo): ResultadoCarrinho {
    const existente = this.linhas().find(l => l.idItem === item.idItem);

    if (item.tipo === 'S') {
      // serviço não é mercadoria: uma unidade por pedido
      if (existente) return { ok: false, mensagem: 'Este serviço já está no carrinho.' };
    } else {
      const estoque = item.estoque ?? 0;
      const naCesta = existente?.quantidade ?? 0;
      if (naCesta + 1 > estoque) {
        return {
          ok: false,
          mensagem: estoque === 0 ? 'Produto sem estoque.' : 'Você já colocou no carrinho todo o estoque disponível.',
        };
      }
    }

    if (existente) {
      this.linhas.update(ls => ls.map(l => (l.idItem === item.idItem ? { ...l, quantidade: l.quantidade + 1 } : l)));
    } else {
      this.linhas.update(ls => [
        ...ls,
        {
          idItem: item.idItem, nome: item.nome, tipo: item.tipo, preco: item.preco,
          quantidade: 1, unidade: item.unidade, estoque: item.estoque,
        },
      ]);
    }
    return { ok: true, mensagem: `${item.nome} adicionado ao carrinho.` };
  }

  alterarQuantidade(idItem: number, quantidade: number) {
    this.linhas.update(ls =>
      ls.map(l => {
        if (l.idItem !== idItem || l.tipo === 'S') return l;
        const maximo = l.estoque ?? Number.MAX_SAFE_INTEGER;
        const pedida = Math.floor(quantidade) || 1;
        return { ...l, quantidade: Math.min(Math.max(1, pedida), maximo) };
      }),
    );
  }

  remover(idItem: number) {
    this.linhas.update(ls => ls.filter(l => l.idItem !== idItem));
  }

  limpar() {
    this.linhas.set([]);
  }

  private recuperar(): LinhaCarrinho[] {
    try {
      const bruto = localStorage.getItem(CHAVE);
      const dados: unknown = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(dados) ? (dados as LinhaCarrinho[]) : [];
    } catch {
      return [];
    }
  }

  private guardar(linhas: LinhaCarrinho[]) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(linhas));
    } catch {
      // armazenamento indisponível: o carrinho continua só em memória
    }
  }
}
