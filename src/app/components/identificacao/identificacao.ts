import { Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MensagemService } from '../../services/mensagem.service';
import { PessoaService } from '../../services/pessoa.service';
import { SessaoService } from '../../services/sessao.service';
import { mensagemErro } from '../../utils/util';

@Component({
  selector: 'app-identificacao',
  imports: [ReactiveFormsModule],
  templateUrl: './identificacao.html',
  styleUrl: './identificacao.css',
})
export class Identificacao {
  private readonly pessoas = inject(PessoaService);
  private readonly sessao = inject(SessaoService);
  private readonly mensagens = inject(MensagemService);

  readonly identificado = output<void>();

  protected readonly campo = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly buscando = signal(false);

  protected entrar() {
    if (this.campo.invalid) {
      this.campo.markAsTouched();
      return;
    }

    this.buscando.set(true);
    this.pessoas.identificar(this.campo.value).subscribe({
      next: pessoa => {
        this.buscando.set(false);
        if (!pessoa) {
          this.mensagens.erro('Cliente não encontrado. Confira o CPF ou o e-mail, ou faça o cadastro.');
          return;
        }
        if (pessoa.ativoPessoa !== 'S') {
          this.mensagens.erro('Este cadastro está inativo.');
          return;
        }
        this.sessao.entrar(pessoa);
        this.mensagens.sucesso(`Olá, ${pessoa.nome.split(' ')[0]}!`);
        this.identificado.emit();
      },
      error: (e: HttpErrorResponse) => {
        this.buscando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}
