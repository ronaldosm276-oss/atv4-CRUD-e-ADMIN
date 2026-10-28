import { Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MensagemService } from '../core/mensagem.service';
import { PessoaService } from '../core/pessoa.service';
import { SessaoService } from '../core/sessao.service';
import { mensagemErro } from '../core/util';

@Component({
  selector: 'app-identificacao',
  imports: [ReactiveFormsModule],
  template: `
    <form class="identificacao" (submit)="$event.preventDefault(); entrar()">
      <label class="campo">
        CPF ou e-mail
        <input type="text" [formControl]="campo" placeholder="000.000.000-00 ou nome@email.com" autocomplete="off">
        @if (campo.invalid && campo.touched) {
          <small class="erro">Informe o CPF ou o e-mail.</small>
        }
      </label>
      <button type="submit" class="botao" [disabled]="buscando()">{{ buscando() ? 'Buscando...' : 'Entrar' }}</button>
    </form>
  `,
  styles: `
    .identificacao { display: flex; flex-wrap: wrap; align-items: flex-start; gap: .75rem; }
    .identificacao .campo { flex: 1; min-width: 15rem; }
    .identificacao .botao { margin-top: 1.35rem; }
  `,
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
