import { Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MensagemService } from '../../services/mensagem.service';
import { mensagemErro } from '../../utils/util';

@Component({
  selector: 'app-identificacao',
  imports: [ReactiveFormsModule],
  templateUrl: './identificacao.html',
  styleUrl: './identificacao.css',
})
export class Identificacao {
  private readonly auth = inject(AuthService);
  private readonly mensagens = inject(MensagemService);

  readonly identificado = output<void>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    login: ['', Validators.required],
    senha: ['', Validators.required],
  });
  protected readonly enviando = signal(false);
  protected readonly mostrar = signal(false);

  protected entrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { login, senha } = this.form.getRawValue();
    this.enviando.set(true);
    this.auth.login(login, senha).subscribe({
      next: r => {
        this.enviando.set(false);
        this.form.controls.senha.reset();
        this.mensagens.sucesso(`Olá, ${r.nome.split(' ')[0]}!`);
        this.identificado.emit();
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}