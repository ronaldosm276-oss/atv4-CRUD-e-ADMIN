import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EntradaEnvio, EntradaResposta, EstoqueResposta } from '../../models/models';
import { EntradaProdutoService } from '../../services/entrada-produto.service';
import { EstoqueService } from '../../services/estoque.service';
import { MensagemService } from '../../services/mensagem.service';
import { hojeLocal, mensagemErro } from '../../utils/util';
import { Moeda } from '../../pipes/moeda.pipe';

// a API rejeita data futura; o formulário avisa antes de enviar
function dataNaoFutura(c: AbstractControl): ValidationErrors | null {
  const data = String(c.value ?? '');
  return data && data > hojeLocal() ? { futura: true } : null;
}

@Component({
  selector: 'app-admin-entradas',
  imports: [ReactiveFormsModule, DatePipe, Moeda],
  templateUrl: './admin-entradas.html',
  styleUrl: './admin-entradas.css',
})
export class AdminEntradas {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly entradas = inject(EntradaProdutoService);
  private readonly estoques = inject(EstoqueService);
  private readonly mensagens = inject(MensagemService);

  protected readonly produtos = signal<EstoqueResposta[]>([]);
  protected readonly historico = signal<EntradaResposta[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly hoje = hojeLocal();

  protected readonly form = this.fb.group({
    idItem: this.fb.control<number | null>(null, Validators.required),
    dataEntradaProduto: [hojeLocal(), [Validators.required, dataNaoFutura]],
    quantidadeEntrada: this.fb.control<number | null>(null, [
      Validators.required, Validators.min(1), Validators.pattern(/^\d+$/),
    ]),
    unidade: ['', [Validators.required, Validators.maxLength(10)]],
    valorUnitarioEntrada: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
  });

  constructor() {
    // ao escolher o produto, a unidade vem preenchida com a do cadastro
    this.form.controls.idItem.valueChanges.pipe(takeUntilDestroyed()).subscribe(id => {
      const produto = this.produtos().find(p => p.idItem === id);
      if (produto) this.form.controls.unidade.setValue((produto.unidade ?? '').trim());
    });
    this.carregar();
  }

  protected invalido(nome: string): boolean {
    const c = this.form.get(nome);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  protected erro(nome: string): string {
    const e = this.form.get(nome)?.errors;
    if (!e) return '';
    if (e['required']) return 'Campo obrigatório.';
    if (e['pattern']) return 'Informe uma quantidade inteira.';
    if (e['min']) return nome === 'quantidadeEntrada' ? 'A quantidade deve ser pelo menos 1.' : 'O valor deve ser maior que zero.';
    if (e['maxlength']) return 'Máximo de 10 caracteres.';
    if (e['futura']) return 'A data não pode ser futura.';
    return 'Valor inválido.';
  }

  protected carregar() {
    this.carregando.set(true);
    forkJoin({ produtos: this.estoques.listar(), historico: this.entradas.listar() }).subscribe({
      next: ({ produtos, historico }) => {
        this.produtos.set([...produtos].sort((a, b) => a.item.localeCompare(b.item, 'pt-BR')));
        this.historico.set([...historico].sort((a, b) => b.idEntradaProduto - a.idEntradaProduto));
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  protected salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagens.erro('Corrija os campos destacados.');
      return;
    }

    const v = this.form.getRawValue();
    if (v.idItem === null || v.quantidadeEntrada === null || v.valorUnitarioEntrada === null) return;

    const entrada: EntradaEnvio = {
      idEntradaProduto: 0,
      idItem: v.idItem,
      dataEntradaProduto: v.dataEntradaProduto,
      quantidadeEntrada: v.quantidadeEntrada,
      unidade: v.unidade.trim(),
      valorUnitarioEntrada: v.valorUnitarioEntrada,
    };

    // o backend registra a entrada e o trigger do banco atualiza estoque e preço de venda
    this.salvando.set(true);
    this.entradas.criar(entrada).subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagens.sucesso('Entrada registrada. Estoque e preço de venda atualizados.');
        this.form.reset({ dataEntradaProduto: hojeLocal() });
        this.carregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}
