import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EstoqueResposta } from '../../models/models';
import { EstoqueService } from '../../services/estoque.service';
import { MensagemService } from '../../services/mensagem.service';
import { mensagemErro } from '../../utils/util';
import { Moeda } from '../../pipes/moeda.pipe';

@Component({
  selector: 'app-admin-estoque',
  imports: [ReactiveFormsModule, Moeda],
  templateUrl: './admin-estoque.html',
  styleUrl: './admin-estoque.css',
})
export class AdminEstoque {
  private readonly servico = inject(EstoqueService);
  private readonly mensagens = inject(MensagemService);

  protected readonly itens = signal<EstoqueResposta[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly modoBusca = signal(false);
  protected readonly busca = new FormControl('', { nonNullable: true });

  constructor() {
    this.carregar();
  }

  protected carregar() {
    this.carregando.set(true);
    this.erro.set(null);
    this.servico.listar().subscribe({
      next: lista => {
        this.itens.set([...lista].sort((a, b) => a.idItem - b.idItem));
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(e));
      },
    });
  }

  protected consultar() {
    const id = Number(this.busca.value.trim());
    if (!Number.isInteger(id) || id <= 0) {
      this.mensagens.erro('Informe o ID do item.');
      return;
    }

    this.servico.obter(id).subscribe({
      next: item => {
        this.itens.set([item]);
        this.modoBusca.set(true);
      },
      error: (e: HttpErrorResponse) => this.mensagens.erro(mensagemErro(e)), // 404: estoque não localizado
    });
  }

  protected voltar() {
    this.modoBusca.set(false);
    this.busca.reset('');
    this.carregar();
  }
}
