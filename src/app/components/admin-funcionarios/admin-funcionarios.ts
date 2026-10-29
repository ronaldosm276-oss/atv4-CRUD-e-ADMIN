import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Funcionario } from '../../models/models';
import { FuncionarioService } from '../../services/funcionario.service';
import { MensagemService } from '../../services/mensagem.service';
import { mensagemErro } from '../../utils/util';
import {
  dataNaoFutura, formatarCpf, formatarTelefone, grupoEndereco, textoErro,
} from '../../utils/pessoa-form';
import { cpfValido, dataNascimentoValida, soDigitos, telefoneValido } from '../../utils/validadores';

@Component({
  selector: 'app-admin-funcionarios',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-funcionarios.html',
  styleUrl: './admin-funcionarios.css',
})
export class AdminFuncionarios {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(FuncionarioService);
  private readonly mensagens = inject(MensagemService);

  protected readonly funcionarios = signal<Funcionario[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erroLista = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly processando = signal<number | null>(null);
  protected readonly editando = signal<Funcionario | null>(null);
  protected readonly modoBusca = signal(false);
  protected readonly busca = new FormControl('', { nonNullable: true });

  protected readonly cpf = formatarCpf;
  protected readonly telefone = formatarTelefone;
  protected readonly textoTotal = computed(() => `${this.funcionarios().length} funcionário(s)`);

  // limites vindos do schema: cargo 20; o cadastro exige pelo menos um endereço
  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    cpf: ['', [Validators.required, cpfValido]],
    dataNascimento: ['', [Validators.required, dataNascimentoValida]],
    sexo: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    telefone: ['', [Validators.required, telefoneValido]],
    cargo: ['', [Validators.required, Validators.maxLength(20)]],
    dataAdmissao: ['', [Validators.required, dataNaoFutura]],
    enderecos: this.fb.array([grupoEndereco(this.fb)]),
  });

  constructor() {
    this.carregar();
  }

  protected get enderecos() {
    return this.form.controls.enderecos;
  }

  protected ativo(f: Funcionario): boolean {
    return f.ativoPessoa === 'S';
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
    this.api.listar().subscribe({
      next: lista => {
        this.funcionarios.set([...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
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
      this.mensagens.erro('Informe o ID do funcionário.');
      return;
    }

    this.api.obter(id).subscribe({
      next: funcionario => {
        this.funcionarios.set([funcionario]);
        this.modoBusca.set(true);
      },
      error: (e: HttpErrorResponse) => this.mensagens.erro(mensagemErro(e)), // 404: funcionário não localizado
    });
  }

  protected adicionarEndereco() {
    this.enderecos.push(grupoEndereco(this.fb));
  }

  // só endereço novo pode ser removido: a API não apaga endereços já gravados
  protected removerEndereco(indice: number) {
    this.enderecos.removeAt(indice);
  }

  protected editar(f: Funcionario) {
    this.editando.set(f);

    this.enderecos.clear();
    for (const e of f.enderecos ?? []) this.enderecos.push(grupoEndereco(this.fb, e));
    if (this.enderecos.length === 0) this.enderecos.push(grupoEndereco(this.fb));

    this.form.patchValue({
      nome: f.nome,
      cpf: String(f.cpf).padStart(11, '0'),
      dataNascimento: f.dataNascimento,
      sexo: f.sexo,
      email: f.email,
      telefone: String(f.telefone),
      cargo: f.cargo,
      dataAdmissao: f.dataAdmissao,
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

    const dto: Funcionario = {
      idPessoa,
      nome: v.nome.trim(),
      cpf: Number(soDigitos(v.cpf)),
      dataNascimento: v.dataNascimento,
      sexo: v.sexo,
      email: v.email.trim().toLowerCase(),
      telefone: Number(soDigitos(v.telefone)),
      ativoPessoa: atual?.ativoPessoa ?? 'S',
      cargo: v.cargo.trim(),
      dataAdmissao: v.dataAdmissao,
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
      ? this.api.atualizar(atual.idPessoa, dto)
      : this.api.criar(dto);

    this.salvando.set(true);
    pedido$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.mensagens.sucesso(atual ? 'Funcionário atualizado.' : 'Funcionário cadastrado.');
        this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  // funcionário que atendeu pedidos não deve ser apagado: desativar o tira da lista de atendentes
  protected alternarAtivo(f: Funcionario) {
    const ativar = !this.ativo(f);
    if (!ativar && !confirm(`Desativar o funcionário "${f.nome}"? Ele deixa de aparecer como atendente na loja.`)) return;

    this.processando.set(f.idPessoa);
    this.api.atualizar(f.idPessoa, { ...f, ativoPessoa: ativar ? 'S' : 'N' }).subscribe({
      next: () => {
        this.processando.set(null);
        this.mensagens.sucesso(ativar ? 'Funcionário ativado.' : 'Funcionário desativado.');
        if (this.editando()?.idPessoa === f.idPessoa) this.cancelar();
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.processando.set(null);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}
