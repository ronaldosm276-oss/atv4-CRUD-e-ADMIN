import { computed, effect, Injectable, signal } from '@angular/core';
import { LoginResposta } from '../models/auth';
import { Pessoa } from '../models/models';

export interface ClienteSessao { idPessoa: number; nome: string; }

const CHAVE = 'minhaloja.sessao';

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly dados = signal<LoginResposta | null>(this.recuperar());

  readonly cliente = computed<ClienteSessao | null>(() => {
    const d = this.dados();
    return d ? { idPessoa: d.idPessoa, nome: d.nome } : null;
  });
  readonly ehFuncionario = computed(() => this.dados()?.perfil === 'Funcionario');
  readonly token = computed(() => this.dados()?.token ?? null);

  constructor() {
    effect(() => this.guardar(this.dados()));
  }

  iniciar(resposta: LoginResposta) {
    this.dados.set(resposta);
  }

  // TEMPORARIO: o cadastro ainda chama entrar(pessoa); sai quando o cadastro for ajustado (lote 2)
  entrar(_pessoa: Pessoa) {}

  sair() {
    this.dados.set(null);
  }

  private recuperar(): LoginResposta | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;
      const d = JSON.parse(bruto) as Partial<LoginResposta> | null;
      if (!d || typeof d.token !== 'string' || typeof d.nome !== 'string' ||
          typeof d.idPessoa !== 'number' || typeof d.expiraEm !== 'string' ||
          (d.perfil !== 'Cliente' && d.perfil !== 'Funcionario')) return null;
      if (Date.parse(d.expiraEm) <= Date.now()) return null;
      return { token: d.token, expiraEm: d.expiraEm, idPessoa: d.idPessoa, nome: d.nome, perfil: d.perfil };
    } catch {
      return null;
    }
  }

  private guardar(dados: LoginResposta | null) {
    try {
      if (dados) localStorage.setItem(CHAVE, JSON.stringify(dados));
      else localStorage.removeItem(CHAVE);
    } catch {
      // armazenamento indisponivel: a sessao vale so ate recarregar a pagina
    }
  }
}