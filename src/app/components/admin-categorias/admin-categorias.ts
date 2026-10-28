import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Categoria } from '../../models/models';
import { CategoriaService } from '../../services/categoria.service';
import { MensagemService } from '../../services/mensagem.service';
import { mensagemErro } from '../../utils/util';

@Component({
  selector: 'app-admin-categorias',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categorias.html',
  styleUrl: './admin-categorias.css',
})
export class AdminCategorias {
  private readonly servico = inject(CategoriaService);
  private readonly mensagens = inject(MensagemService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly editando = signal<Categoria | null>(null);

  // categoria.categoria é VARCHAR(35) no banco
  protected readonly nome = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(35)],
  });

  constructor() {
    this.carregar();
  }

  protected erroNome(): string {
    const e = this.nome.errors;
    if (!e) return '';
    if (e['required']) return 'Informe o nome da categoria.';
    if (e['maxlength']) return 'Máximo de 35 caracteres.';
    if (e['duplicada']) return 'Já existe uma categoria com esse nome.';
    return 'Valor inválido.';
  }

  protected carregar() {
    this.carregando.set(true);
    this.servico.listar().subscribe({
      next: lista => {
        this.categorias.set([...lista].sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR')));
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  protected salvar() {
    this.nome.markAsTouched();
    if (this.nome.invalid) return;

    const nome = this.nome.value.trim();
    const atual = this.editando();
    const repetida = this.categorias().some(
      c => c.categoria.toLowerCase() === nome.toLowerCase() && c.idcategoria !== atual?.idcategoria,
    );
    if (repetida) {
      this.nome.setErrors({ duplicada: true });
      return;
    }

    const pedido$: Observable<unknown> = atual
      ? this.servico.atualizar(atual.idcategoria, { ...atual, categoria: nome })
      : this.servico.criar({ idcategoria: 0, categoria: nome });

    this.salvando.set(true);
    pedido$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagens.sucesso(atual ? 'Categoria atualizada.' : 'Categoria adicionada.');
        this.cancelar();
        this.carregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  protected editar(categoria: Categoria) {
    this.editando.set(categoria);
    this.nome.setValue(categoria.categoria);
    this.nome.markAsUntouched();
  }

  protected cancelar() {
    this.editando.set(null);
    this.nome.reset('');
  }

  protected excluir(categoria: Categoria) {
    if (!confirm(`Excluir a categoria "${categoria.categoria}"?`)) return;

    // o banco recusa se ainda houver produtos ou serviços nessa categoria; a API explica o motivo
    this.servico.excluir(categoria.idcategoria).subscribe({
      next: () => {
        this.mensagens.sucesso('Categoria excluída.');
        if (this.editando()?.idcategoria === categoria.idcategoria) this.cancelar();
        this.carregar();
      },
      error: (e: HttpErrorResponse) => this.mensagens.erro(mensagemErro(e)),
    });
  }
}