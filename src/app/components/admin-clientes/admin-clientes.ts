import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { Pessoa } from '../../models/models';
import { FuncionarioService } from '../../services/funcionario.service';
import { MensagemService } from '../../services/mensagem.service';
import { PessoaService } from '../../services/pessoa.service';
import { mensagemErro } from '../../utils/util';
import { formatarCpf, formatarTelefone, grupoEndereco, textoErro } from '../../utils/pessoa-form';
import { cpfValido, dataNascimentoValida, soDigitos, telefoneValido } from '../../utils/validadores';

@Component({
  selector: 'app-admin-clientes',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-clientes.html',
  styleUrl: './admin-clientes.css',
})
export class AdminClientes {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly pessoasApi = inject(PessoaService);
  private readonly funcionariosApi = inject(FuncionarioService);
  private readonly mensagens = inject(MensagemService);

  protected readonly pessoas = signal<Pessoa[]>([]);
  protected readonly idsFuncionarios = signal<Set<number>>(new Set());
  protected readonly carregando = signal(true);
  protected readonly erroLista = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly processando = signal<number | null>(null);
  protected readonly editando = signal<Pessoa | null>(null);
  protected readonly modoBusca = signal(false);
  protected readonly busca = new FormControl('', { nonNullable: true });

  protected readonly cpf = formatarCpf;
  protected readonly telefone = formatarTelefone;
  protected readonly textoTotal = computed(() => `${this.pessoas().length} cadastro(s)`);

  // limites vindos do schema: nome e e-mail 100, endereço (cep 8, número 10, complemento 150)
  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    cpf: ['', [Validators.required, cpfValido]],
    dataNascimento: ['', [Validators.required, dataNascimentoValida]],
    sexo: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    telefone: ['', [Validators.required, telefoneValido]],
    enderecos: this.fb.array([grupoEndereco(this.fb)]),
  });

  constructor() {
    this.carregar();
  }

  protected get enderecos() {
    return this.form.controls.enderecos;
  }

  protected ativo(p: Pessoa): boolean {
    return p.ativoPessoa === 'S';
  }

  protected invalido(c: AbstractControl): boolean {
    return c.invalid && (c.touched || c.dirty);
  }

  protected erro(c: AbstractControl): string {
    return textoErro(c.errors);
  }

  protected carregar() {
    this.carregando.set(true);
    this.erroLista.set(null);
    forkJoin({ pessoas: this.pessoasApi.listar(), funcionarios: this.funcionariosApi.listar() }).subscribe({
      next: ({ pessoas, funcionarios }) => {
        this.pessoas.set([...pessoas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
        this.idsFuncionarios.set(new Set(funcionarios.map(f => f.idPessoa)));
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
      this.mensagens.erro('Informe o ID do cliente.');
      return;
    }

    this.pessoasApi.obter(id).subscribe({
      next: pessoa => {
        this.pessoas.set([pessoa]);
        this.modoBusca.set(true);
      },
      error: (e: HttpErrorResponse) => this.mensagens.erro(mensagemErro(e)), // 404: pessoa não localizada
    });
  }

  protected adicionarEndereco() {
    this.enderecos.push(grupoEndereco(this.fb));
  }

  // só endereço novo pode ser removido: a API não apaga endereços já gravados
  protected removerEndereco(indice: number) {
    this.enderecos.removeAt(indice);
  }

  protected editar(p: Pessoa) {
    this.editando.set(p);

    this.enderecos.clear();
    for (const e of p.enderecos ?? []) this.enderecos.push(grupoEndereco(this.fb, e));
    if (this.enderecos.length === 0) this.enderecos.push(grupoEndereco(this.fb));

    this.form.patchValue({
      nome: p.nome,
      cpf: String(p.cpf).padStart(11, '0'),
      dataNascimento: p.dataNascimento,
      sexo: p.sexo,
      email: p.email,
      telefone: String(p.telefone),
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  protected cancelar() {
    this.editando.set(null);
    this.enderecos.clear();
    this.enderecos.push(grupoEndereco(this.fb));
    this.form.reset();
  }

  protected salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagens.erro('Corrija os campos destacados.');
      return;
    }

    const v = this.form.getRawValue();
    const atual = this.editando();
    const idPessoa = atual?.idPessoa ?? 0;

    const dto: Pessoa = {
      idPessoa,
      nome: v.nome.trim(),
      cpf: Number(soDigitos(v.cpf)),
      dataNascimento: v.dataNascimento,
      sexo: v.sexo,
      email: v.email.trim().toLowerCase(),
      telefone: Number(soDigitos(v.telefone)),
      ativoPessoa: atual?.ativoPessoa ?? 'S',
      enderecos: v.enderecos.map(e => ({
        idEndereco: e.idEndereco,
        idPessoa,
        cep: soDigitos(e.cep),
        numero: e.numero.trim(),
        complemento: e.complemento.trim(),
      })),
    };

    // CPF ou e-mail repetidos voltam da API como 409 com a mensagem pronta
    const pedido$: Observable<unknown> = atual
      ? this.pessoasApi.atualizar(atual.idPessoa, dto)
      : this.pessoasApi.criar(dto);

    this.salvando.set(true);
    pedido$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagens.sucesso(atual ? 'Cliente atualizado.' : 'Cliente cadastrado.');
        this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  // cliente com pedidos não deve ser apagado: desativar mantém o histórico
  protected alternarAtivo(p: Pessoa) {
    const ativar = !this.ativo(p);
    if (!ativar && !confirm(`Desativar o cadastro de "${p.nome}"?`)) return;

    this.processando.set(p.idPessoa);
    this.pessoasApi.atualizar(p.idPessoa, { ...p, ativoPessoa: ativar ? 'S' : 'N' }).subscribe({
      next: () => {
        this.processando.set(null);
        this.mensagens.sucesso(ativar ? 'Cadastro ativado.' : 'Cadastro desativado.');
        if (this.editando()?.idPessoa === p.idPessoa) this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.processando.set(null);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}
