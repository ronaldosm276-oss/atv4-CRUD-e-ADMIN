import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Atendimento } from '../../models/models';
import { ACAO_STATUS, CodigoStatus, proximosStatus, rotuloStatus, STATUS_PEDIDO } from '../../models/status';
import { AtendimentoService } from '../../services/atendimento.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { MensagemService } from '../../services/mensagem.service';
import { mensagemErro } from '../../utils/util';
import { Moeda } from '../../pipes/moeda.pipe';

@Component({
  selector: 'app-admin-pedidos',
  imports: [DatePipe, ReactiveFormsModule, Moeda],
  templateUrl: './admin-pedidos.html',
  styleUrl: './admin-pedidos.css',
})
export class AdminPedidos {
  private readonly atendimentos = inject(AtendimentoService);
  private readonly funcionarios = inject(FuncionarioService);
  private readonly mensagens = inject(MensagemService);

  protected readonly opcoes: { valor: '' | CodigoStatus; rotulo: string }[] = [
    { valor: '', rotulo: 'Todos' },
    ...(Object.keys(STATUS_PEDIDO) as CodigoStatus[]).map(c => ({ valor: c, rotulo: STATUS_PEDIDO[c] })),
  ];

  protected readonly filtro = signal<'' | CodigoStatus>('A'); // abre em "pedidos em aberto"
  protected readonly pedidos = signal<Atendimento[]>([]);
  protected readonly cargos = signal<Map<number, string>>(new Map());
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly aberto = signal<number | null>(null);
  protected readonly processando = signal<number | null>(null);
  protected readonly modoBusca = signal(false);
  protected readonly busca = new FormControl('', { nonNullable: true });

  protected readonly rotulo = rotuloStatus;
  protected readonly proximos = proximosStatus;
  protected readonly acao = ACAO_STATUS;

  constructor() {
    // a API devolve só o nome do funcionário; o cargo vem do cadastro de funcionários
    this.funcionarios.listar().subscribe({
      next: lista => this.cargos.set(new Map(lista.map(f => [f.idPessoa, f.cargo] as const))),
      error: () => {
        // sem o cargo a tela continua funcionando
      },
    });
    this.carregar();
  }

  protected cargo(idFuncionario: number): string {
    return this.cargos().get(idFuncionario) ?? '—';
  }

  protected escolherFiltro(valor: '' | CodigoStatus) {
    this.filtro.set(valor);
    this.modoBusca.set(false);
    this.carregar();
  }

  protected carregar() {
    this.carregando.set(true);
    this.erro.set(null);
    this.aberto.set(null);
    this.atendimentos.filtrar({ status: this.filtro() || undefined }).subscribe({
      next: lista => {
        this.pedidos.set([...lista].sort((a, b) => b.idAtendimento - a.idAtendimento));
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        if (e.status === 404) {
          this.pedidos.set([]); // nenhum pedido nessa situação não é erro
        } else {
          this.erro.set(mensagemErro(e));
        }
      },
    });
  }

  protected buscar() {
    const id = Number(this.busca.value.trim());
    if (!Number.isInteger(id) || id <= 0) {
      this.mensagens.erro('Informe um número de pedido válido.');
      return;
    }
    this.abrirPorId(id);
  }

  protected voltar() {
    this.modoBusca.set(false);
    this.busca.reset('');
    this.carregar();
  }

  protected alternar(idAtendimento: number) {
    this.aberto.set(this.aberto() === idAtendimento ? null : idAtendimento);
  }

  protected mudarStatus(pedido: Atendimento, novo: CodigoStatus) {
    if (novo === 'X' && !confirm(`Cancelar o pedido nº ${pedido.idAtendimento}? Os produtos voltam ao estoque.`)) {
      return;
    }

    this.processando.set(pedido.idAtendimento);
    // as transições permitidas são validadas pelo backend (409 se não for permitida)
    this.atendimentos.mudarStatus(pedido.idAtendimento, novo).subscribe({
      next: () => {
        this.processando.set(null);
        this.mensagens.sucesso(`Pedido nº ${pedido.idAtendimento}: ${rotuloStatus(novo)}.`);
        if (this.modoBusca()) {
          this.abrirPorId(pedido.idAtendimento);
        } else {
          this.carregar();
        }
      },
      error: (e: HttpErrorResponse) => {
        this.processando.set(null);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  private abrirPorId(id: number) {
    this.carregando.set(true);
    this.erro.set(null);
    this.atendimentos.obter(id).subscribe({
      next: pedido => {
        this.pedidos.set([pedido]);
        this.modoBusca.set(true);
        this.aberto.set(pedido.idAtendimento);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.mensagens.erro(mensagemErro(e)); // 404: pedido não localizado
      },
    });
  }
}
