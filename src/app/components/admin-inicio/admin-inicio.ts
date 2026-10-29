import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Atendimento, EstoqueResposta, Funcionario, Item, Pessoa } from '../../models/models';
import { CodigoStatus, rotuloStatus, STATUS_PEDIDO } from '../../models/status';
import { AtendimentoService } from '../../services/atendimento.service';
import { EstoqueService } from '../../services/estoque.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { ItemService } from '../../services/item.service';
import { PessoaService } from '../../services/pessoa.service';
import { mensagemErro } from '../../utils/util';
import { Moeda } from '../../pipes/moeda.pipe';

// a partir de quantas unidades o estoque é considerado baixo
const LIMITE_ESTOQUE_BAIXO = 5;

interface Resumo {
  clientes: number;
  clientesAtivos: number;
  funcionarios: number;
  produtos: number;
  produtosAtivos: number;
  servicos: number;
  servicosAtivos: number;
  pedidos: number;
  porStatus: Record<CodigoStatus, number>;
  faturamento: number;
  unidadesEstoque: number;
  estoqueBaixo: number;
  semEstoque: number;
}

@Component({
  selector: 'app-admin-inicio',
  imports: [RouterLink, Moeda],
  templateUrl: './admin-inicio.html',
  styleUrl: './admin-inicio.css',
})
export class AdminInicio {
  private readonly pessoas = inject(PessoaService);
  private readonly funcionarios = inject(FuncionarioService);
  private readonly itens = inject(ItemService);
  private readonly atendimentos = inject(AtendimentoService);
  private readonly estoques = inject(EstoqueService);

  protected readonly resumo = signal<Resumo | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  protected readonly status = Object.keys(STATUS_PEDIDO) as CodigoStatus[];
  protected readonly rotulo = rotuloStatus;
  protected readonly limiteBaixo = LIMITE_ESTOQUE_BAIXO;

  constructor() {
    this.carregar();
  }

  protected carregar() {
    this.carregando.set(true);
    this.erro.set(null);
    forkJoin({
      pessoas: this.pessoas.listar(),
      funcionarios: this.funcionarios.listar(),
      itens: this.itens.listar(),
      pedidos: this.atendimentos.listar(),
      estoque: this.estoques.listar(),
    }).subscribe({
      next: dados => {
        this.resumo.set(this.resumir(dados.pessoas, dados.funcionarios, dados.itens, dados.pedidos, dados.estoque));
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(e));
      },
    });
  }

  private resumir(
    pessoas: Pessoa[], funcionarios: Funcionario[], itens: Item[], pedidos: Atendimento[], estoque: EstoqueResposta[],
  ): Resumo {
    const produtos = itens.filter(i => i.tipoItem === 'P');
    const servicos = itens.filter(i => i.tipoItem === 'S');

    const porStatus: Record<CodigoStatus, number> = { A: 0, P: 0, C: 0, X: 0 };
    let faturamento = 0;
    for (const p of pedidos) {
      const s = p.statusAtendimento as CodigoStatus;
      if (s in porStatus) porStatus[s]++;
      if (s === 'C') faturamento += p.valorTotal; // só pedido concluído conta como venda
    }

    return {
      clientes: pessoas.length,
      clientesAtivos: pessoas.filter(p => p.ativoPessoa === 'S').length,
      funcionarios: funcionarios.length,
      produtos: produtos.length,
      produtosAtivos: produtos.filter(i => i.ativoProdutoServico === 'S').length,
      servicos: servicos.length,
      servicosAtivos: servicos.filter(i => i.ativoProdutoServico === 'S').length,
      pedidos: pedidos.length,
      porStatus,
      faturamento,
      unidadesEstoque: estoque.reduce((soma, e) => soma + e.quantidadeEstoque, 0),
      estoqueBaixo: estoque.filter(e => e.quantidadeEstoque > 0 && e.quantidadeEstoque <= LIMITE_ESTOQUE_BAIXO).length,
      semEstoque: estoque.filter(e => e.quantidadeEstoque === 0).length,
    };
  }
}
