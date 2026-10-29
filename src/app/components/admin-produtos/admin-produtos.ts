import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { Categoria, ProdutoEnvio, ProdutoLeitura } from '../../models/models';
import { CategoriaService } from '../../services/categoria.service';
import { MensagemService } from '../../services/mensagem.service';
import { ProdutoService } from '../../services/produto.service';
import { mensagemErro } from '../../utils/util';
import { duasCasas } from '../../utils/validadores';
import { Moeda } from '../../pipes/moeda.pipe';

@Component({
  selector: 'app-admin-produtos',
  imports: [ReactiveFormsModule, Moeda],
  templateUrl: './admin-produtos.html',
  styleUrl: './admin-produtos.css',
})
export class AdminProdutos {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly produtosApi = inject(ProdutoService);
  private readonly categoriasApi = inject(CategoriaService);
  private readonly mensagens = inject(MensagemService);

  protected readonly produtos = signal<ProdutoLeitura[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erroLista = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly processando = signal<number | null>(null);
  protected readonly editando = signal<ProdutoLeitura | null>(null);
  protected readonly modoBusca = signal(false);
  protected readonly busca = new FormControl('', { nonNullable: true });

  private readonly nomesCategoria = computed(
    () => new Map(this.categorias().map(c => [c.idcategoria, c.categoria] as const)),
  );

  // limites vindos do schema: item 40, descricao 200, unidade 10, DECIMAL(10,2)
  protected readonly form = this.fb.group({
    item: ['', [Validators.required, Validators.maxLength(40)]],
    descricaoItem: ['', [Validators.required, Validators.maxLength(200)]],
    idCategoria: this.fb.control<number | null>(null, Validators.required),
    preco: this.fb.control<number | null>(null, [
      Validators.required, Validators.min(0.01), Validators.max(99999999.99), duasCasas,
    ]),
    precoVenda: this.fb.control<number | null>(null, [
      Validators.required, Validators.min(0.01), Validators.max(99999999.99), duasCasas,
    ]),
    codigoPreco: this.fb.control<number | null>(null, [
      Validators.required, Validators.min(1), Validators.pattern(/^\d+$/),
    ]),
    unidade: ['UN', [Validators.required, Validators.maxLength(10)]],
  });

  constructor() {
    this.carregar();
  }

  protected categoria(id: number): string {
    return this.nomesCategoria().get(id) ?? '—';
  }

  protected ativo(p: ProdutoLeitura): boolean {
    return p.iditemNavigation.ativoProdutoServico === 'S';
  }

  protected invalido(nome: string): boolean {
    const c = this.form.get(nome);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  protected erro(nome: string): string {
    const e = this.form.get(nome)?.errors;
    if (!e) return '';
    if (e['required']) return 'Campo obrigatório.';
    if (e['maxlength']) return `Máximo de ${e['maxlength'].requiredLength} caracteres.`;
    if (e['min']) return 'O valor deve ser maior que zero.';
    if (e['max']) return 'Valor acima do permitido.';
    if (e['casas']) return 'Use no máximo 2 casas decimais.';
    if (e['pattern']) return 'Informe um número inteiro.';
    return 'Valor inválido.';
  }

  protected carregar() {
    this.carregando.set(true);
    this.erroLista.set(null);
    forkJoin({ produtos: this.produtosApi.listar(), categorias: this.categoriasApi.listar() }).subscribe({
      next: ({ produtos, categorias }) => {
        this.categorias.set([...categorias].sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR')));
        this.produtos.set(
          [...produtos].sort((a, b) =>
            a.iditemNavigation.item1.localeCompare(b.iditemNavigation.item1, 'pt-BR')),
        );
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroLista.set(mensagemErro(e));
      },
    });
  }

  protected recarregar() {
    this.modoBusca.set(false);
    this.busca.reset('');
    this.carregar();
  }

  protected consultar() {
    const id = Number(this.busca.value.trim());
    if (!Number.isInteger(id) || id <= 0) {
      this.mensagens.erro('Informe o ID do produto.');
      return;
    }

    this.produtosApi.obter(id).subscribe({
      next: produto => {
        this.produtos.set([produto]);
        this.modoBusca.set(true);
      },
      error: (e: HttpErrorResponse) => this.mensagens.erro(mensagemErro(e)), // 404: produto não localizado
    });
  }

  protected editar(p: ProdutoLeitura) {
    const n = p.iditemNavigation;
    this.editando.set(p);
    this.form.reset({
      item: n.item1,
      descricaoItem: n.descricaoItem,
      idCategoria: n.idcategoria,
      preco: n.preco,
      precoVenda: p.precoVenda,
      codigoPreco: p.codigoPreco,
      unidade: (p.unidade ?? '').trim(),
    });
  }

  protected cancelar() {
    this.editando.set(null);
    this.form.reset({ unidade: 'UN' });
  }

  protected salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagens.erro('Corrija os campos destacados.');
      return;
    }

    const v = this.form.getRawValue();
    if (v.idCategoria === null || v.preco === null || v.precoVenda === null || v.codigoPreco === null) return;

    const atual = this.editando();
    const dto: ProdutoEnvio = {
      idCategoria: v.idCategoria,
      item: v.item.trim(),
      descricaoItem: v.descricaoItem.trim(),
      preco: v.preco,
      tipoItem: 'P',
      ativoProdutoServico: atual?.iditemNavigation.ativoProdutoServico ?? 'S',
      codigoPreco: v.codigoPreco,
      precoVenda: v.precoVenda,
      unidade: v.unidade.trim(),
    };

    const pedido$: Observable<unknown> = atual
      ? this.produtosApi.atualizar(atual.iditem, dto)
      : this.produtosApi.criar(dto);

    this.salvando.set(true);
    pedido$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagens.sucesso(atual ? 'Produto atualizado.' : 'Produto cadastrado.');
        this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  // produto com vendas ou entradas não deve ser apagado: desativar o tira da loja e mantém o histórico
  protected alternarAtivo(p: ProdutoLeitura) {
    const n = p.iditemNavigation;
    const ativar = !this.ativo(p);
    if (!ativar && !confirm(`Desativar o produto "${n.item1}"? Ele deixa de aparecer na loja.`)) return;

    const dto: ProdutoEnvio = {
      idCategoria: n.idcategoria,
      item: n.item1,
      descricaoItem: n.descricaoItem,
      preco: n.preco,
      tipoItem: n.tipoItem,
      ativoProdutoServico: ativar ? 'S' : 'N',
      codigoPreco: p.codigoPreco,
      precoVenda: p.precoVenda,
      unidade: (p.unidade ?? '').trim(),
    };

    this.processando.set(p.iditem);
    this.produtosApi.atualizar(p.iditem, dto).subscribe({
      next: () => {
        this.processando.set(null);
        this.mensagens.sucesso(ativar ? 'Produto ativado.' : 'Produto desativado.');
        if (this.editando()?.iditem === p.iditem) this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.processando.set(null);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}
