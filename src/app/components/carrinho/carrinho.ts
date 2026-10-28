import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Funcionario, AtendimentoEnvio } from '../../models/models';
import { AtendimentoService } from '../../services/atendimento.service';
import { CarrinhoService } from '../../services/carrinho.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { MensagemService } from '../../services/mensagem.service';
import { SessaoService } from '../../services/sessao.service';
import { hojeLocal, mensagemErro } from '../../utils/util';
import { Moeda } from '../../pipes/moeda.pipe';
import { Identificacao } from '../identificacao/identificacao';

@Component({
  selector: 'app-carrinho',
  imports: [RouterLink, Moeda, Identificacao],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.css',
})
export class Carrinho {
  protected readonly carrinho = inject(CarrinhoService);
  protected readonly sessao = inject(SessaoService);
  private readonly funcionarios = inject(FuncionarioService);
  private readonly atendimentos = inject(AtendimentoService);
  private readonly mensagens = inject(MensagemService);
  private readonly router = inject(Router);

  protected readonly atendentes = signal<Funcionario[]>([]);
  protected readonly idAtendente = signal(0);
  protected readonly enviando = signal(false);

  protected readonly podeFinalizar = computed(
    () => this.sessao.cliente() !== null && this.idAtendente() > 0 && this.carrinho.linhas().length > 0,
  );

  constructor() {
    // a API exige o funcionário que atende cada item do pedido
    this.funcionarios.listar().subscribe({
      next: lista => this.atendentes.set(lista.filter(f => f.ativoPessoa === 'S')),
      error: (e: HttpErrorResponse) => this.mensagens.erro(mensagemErro(e)),
    });
  }

  protected finalizar() {
    const cliente = this.sessao.cliente();
    if (!cliente) {
      this.mensagens.erro('Identifique-se para finalizar a compra.');
      return;
    }
    if (this.idAtendente() === 0) {
      this.mensagens.erro('Escolha o atendente.');
      return;
    }

    // o pedido nasce "Aberto" (A); pagamento está fora do escopo da atividade
    const pedido: AtendimentoEnvio = {
      idAtendimento: 0,
      idPessoa: cliente.idPessoa,
      dataAtendimento: hojeLocal(),
      statusAtendimento: 'A',
      itens: this.carrinho.linhas().map(l => ({
        idItem: l.idItem,
        idFuncionario: this.idAtendente(),
        quantidadeItens: l.quantidade,
        valorUnitario: l.preco,
      })),
    };

    this.enviando.set(true);
    this.atendimentos.criar(pedido).subscribe({
      next: criado => {
        this.enviando.set(false);
        this.carrinho.limpar();
        const numero = criado?.idAtendimento ? ` nº ${criado.idAtendimento}` : '';
        this.mensagens.sucesso(`Pedido${numero} registrado! Acompanhe em "Meus pedidos".`);
        this.router.navigate(['/loja/pedidos']);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}