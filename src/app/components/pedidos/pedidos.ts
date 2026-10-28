import { Component, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Atendimento } from '../../models/models';
import { rotuloStatus } from '../../models/status';
import { AtendimentoService } from '../../services/atendimento.service';
import { MensagemService } from '../../services/mensagem.service';
import { SessaoService } from '../../services/sessao.service';
import { mensagemErro } from '../../utils/util';
import { Moeda } from '../../pipes/moeda.pipe';
import { Identificacao } from '../identificacao/identificacao';

@Component({
  selector: 'app-pedidos',
  imports: [RouterLink, DatePipe, Moeda, Identificacao],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  private readonly atendimentos = inject(AtendimentoService);
  private readonly mensagens = inject(MensagemService);
  protected readonly sessao = inject(SessaoService);

  protected readonly pedidos = signal<Atendimento[]>([]);
  protected readonly carregando = signal(false);
  protected readonly aberto = signal<number | null>(null);
  protected readonly rotulo = rotuloStatus;

  constructor() {
    // recarrega sempre que o cliente identificado mudar (entrar, sair, trocar)
    effect(() => {
      const cliente = this.sessao.cliente();
      untracked(() => {
        this.aberto.set(null);
        if (cliente) {
          this.carregar(cliente.idPessoa);
        } else {
          this.pedidos.set([]);
        }
      });
    });
  }

  protected alternar(idAtendimento: number) {
    this.aberto.set(this.aberto() === idAtendimento ? null : idAtendimento);
  }

  private carregar(idPessoa: number) {
    this.carregando.set(true);
    // o filtro é feito pela API, então nunca chegam pedidos de outro cliente
    this.atendimentos.filtrar({ idPessoa }).subscribe({
      next: lista => {
        this.pedidos.set([...lista].sort((a, b) => b.idAtendimento - a.idAtendimento));
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        if (e.status === 404) {
          this.pedidos.set([]); // sem pedidos não é erro
        } else {
          this.mensagens.erro(mensagemErro(e));
        }
      },
    });
  }
}