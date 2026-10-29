import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { Categoria, Item } from '../../models/models';
import { CategoriaService } from '../../services/categoria.service';
import { ItemService } from '../../services/item.service';
import { MensagemService } from '../../services/mensagem.service';
import { mensagemErro } from '../../utils/util';
import { duasCasas } from '../../utils/validadores';
import { Moeda } from '../../pipes/moeda.pipe';

@Component({
  selector: 'app-admin-servicos',
  imports: [ReactiveFormsModule, Moeda],
  templateUrl: './admin-servicos.html',
  styleUrl: './admin-servicos.css',
})
export class AdminServicos {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly itensApi = inject(ItemService);
  private readonly categoriasApi = inject(CategoriaService);
  private readonly mensagens = inject(MensagemService);

  protected readonly servicos = signal<Item[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erroLista = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly processando = signal<number | null>(null);
  protected readonly editando = signal<Item | null>(null);
  protected readonly modoBusca = signal(false);
  protected readonly busca = new FormControl('', { nonNullable: true });

  private readonly nomesCategoria = computed(
    () => new Map(this.categorias().map(c => [c.idcategoria, c.categoria] as const)),
  );

  // limites vindos do schema: item 40, descricao 200, DECIMAL(10,2)
  protected readonly form = this.fb.group({
    item: ['', [Validators.required, Validators.maxLength(40)]],
    descricaoItem: ['', [Validators.required, Validators.maxLength(200)]],
    idCategoria: this.fb.control<number | null>(null, Validators.required),
    preco: this.fb.control<number | null>(null, [
      Validators.required, Validators.min(0.01), Validators.max(99999999.99), duasCasas,
    ]),
  });

  constructor() {
    this.carregar();
  }

  protected categoria(s: Item): string {
    return this.nomesCategoria().get(s.idCategoria) ?? s.categoria ?? '—';
  }

  protected ativo(s: Item): boolean {
    return s.ativoProdutoServico === 'S';
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
    return 'Valor inválido.';
  }

  protected carregar() {
    this.carregando.set(true);
    this.erroLista.set(null);
    forkJoin({ itens: this.itensApi.listar(), categorias: this.categoriasApi.listar() }).subscribe({
      next: ({ itens, categorias }) => {
        this.categorias.set([...categorias].sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR')));
        // a tela só trata serviços; produtos têm a tela própria
        this.servicos.set(
          itens.filter(i => i.tipoItem === 'S').sort((a, b) => a.item.localeCompare(b.item, 'pt-BR')),
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
      this.mensagens.erro('Informe o ID do serviço.');
      return;
    }

    this.itensApi.obter(id).subscribe({
      next: item => {
        if (item.tipoItem !== 'S') {
          this.mensagens.erro('Este ID pertence a um produto. Use a tela de Produtos.');
          return;
        }
        this.servicos.set([item]);
        this.modoBusca.set(true);
      },
      error: (e: HttpErrorResponse) => this.mensagens.erro(mensagemErro(e)), // 404: item não localizado
    });
  }

  protected editar(s: Item) {
    this.editando.set(s);
    this.form.reset({
      item: s.item,
      descricaoItem: s.descricaoItem,
      idCategoria: s.idCategoria,
      preco: s.preco,
    });
  }

  protected cancelar() {
    this.editando.set(null);
    this.form.reset();
  }

  protected salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagens.erro('Corrija os campos destacados.');
      return;
    }

    const v = this.form.getRawValue();
    if (v.idCategoria === null || v.preco === null) return;

    const atual = this.editando();
    const dto: Item = {
      idItem: atual?.idItem ?? 0,
      idCategoria: v.idCategoria,
      item: v.item.trim(),
      descricaoItem: v.descricaoItem.trim(),
      preco: v.preco,
      tipoItem: 'S',
      ativoProdutoServico: atual?.ativoProdutoServico ?? 'S',
    };

    const pedido$: Observable<unknown> = atual
      ? this.itensApi.atualizar(atual.idItem, dto)
      : this.itensApi.criar(dto);

    this.salvando.set(true);
    pedido$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagens.sucesso(atual ? 'Serviço atualizado.' : 'Serviço cadastrado.');
        this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  // serviço já vendido não deve ser apagado: desativar o tira da loja e mantém o histórico
  protected alternarAtivo(s: Item) {
    const ativar = !this.ativo(s);
    if (!ativar && !confirm(`Desativar o serviço "${s.item}"? Ele deixa de aparecer na loja.`)) return;

    const dto: Item = {
      idItem: s.idItem,
      idCategoria: s.idCategoria,
      item: s.item,
      descricaoItem: s.descricaoItem,
      preco: s.preco,
      tipoItem: s.tipoItem,
      ativoProdutoServico: ativar ? 'S' : 'N',
    };

    this.processando.set(s.idItem);
    this.itensApi.atualizar(s.idItem, dto).subscribe({
      next: () => {
        this.processando.set(null);
        this.mensagens.sucesso(ativar ? 'Serviço ativado.' : 'Serviço desativado.');
        if (this.editando()?.idItem === s.idItem) this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.processando.set(null);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}
