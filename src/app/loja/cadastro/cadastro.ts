import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MensagemService } from '../../core/mensagem.service';
import { Pessoa } from '../../core/models';
import { PessoaService } from '../../core/pessoa.service';
import { SessaoService } from '../../core/sessao.service';
import { mensagemErro } from '../../core/util';
import {
  cepValido, cpfValido, dataNascimentoValida, soDigitos, telefoneValido,
} from '../../core/validadores';
import { Identificacao } from '../../shared/identificacao';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink, Identificacao],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly pessoas = inject(PessoaService);
  private readonly sessao = inject(SessaoService);
  private readonly mensagens = inject(MensagemService);
  private readonly router = inject(Router);

  protected readonly salvando = signal(false);

  // limites vêm do schema do banco (VARCHAR/CHAR)
  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    cpf: ['', [Validators.required, cpfValido]],
    dataNascimento: ['', [Validators.required, dataNascimentoValida]],
    sexo: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    telefone: ['', [Validators.required, telefoneValido]],
    endereco: this.fb.group({
      cep: ['', [Validators.required, cepValido]],
      numero: ['', [Validators.required, Validators.maxLength(10)]],
      complemento: ['', [Validators.required, Validators.maxLength(150)]],
    }),
  });

  protected invalido(caminho: string): boolean {
    const c = this.form.get(caminho);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  protected erro(caminho: string): string {
    const e = this.form.get(caminho)?.errors;
    if (!e) return '';
    if (e['required']) return 'Campo obrigatório.';
    if (e['email']) return 'E-mail inválido.';
    if (e['maxlength']) return `Máximo de ${e['maxlength'].requiredLength} caracteres.`;
    if (e['cpf']) return 'CPF inválido.';
    if (e['telefone']) return 'Informe o telefone com DDD (10 ou 11 dígitos).';
    if (e['cep']) return 'O CEP deve ter 8 dígitos.';
    if (e['futura']) return 'A data de nascimento não pode ser futura.';
    if (e['data']) return 'Data de nascimento inválida.';
    return 'Valor inválido.';
  }

  protected salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagens.erro('Corrija os campos destacados.');
      return;
    }

    const v = this.form.getRawValue();
    const dto: Pessoa = {
      idPessoa: 0,
      nome: v.nome.trim(),
      cpf: Number(soDigitos(v.cpf)),
      dataNascimento: v.dataNascimento,
      sexo: v.sexo,
      email: v.email.trim().toLowerCase(),
      telefone: Number(soDigitos(v.telefone)),
      ativoPessoa: 'S',
      enderecos: [
        {
          idEndereco: 0,
          idPessoa: 0,
          cep: soDigitos(v.endereco.cep),
          numero: v.endereco.numero.trim(),
          complemento: v.endereco.complemento.trim(),
        },
      ],
    };

    this.salvando.set(true);
    this.pessoas.criar(dto).subscribe({
      next: criada => {
        this.salvando.set(false);
        if (criada?.idPessoa) {
          this.sessao.entrar(criada);
          this.mensagens.sucesso(`Cadastro realizado! Bem-vindo(a), ${dto.nome.split(' ')[0]}.`);
        } else {
          this.mensagens.sucesso('Cadastro realizado! Use seu CPF ou e-mail para se identificar.');
        }
        this.router.navigate(['/loja']);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  protected limpar() {
    this.form.reset();
  }

  protected irParaLoja() {
    this.router.navigate(['/loja']);
  }
}
