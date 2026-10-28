import { effect, Injectable, signal } from '@angular/core';
import { Pessoa } from '../models/models';

export interface ClienteSessao { idPessoa: number; nome: string; }

const CHAVE = 'minhaloja.cliente';

// Não há senha no sistema (o roteiro pede só "identificar" o cliente), então a
// identificação vale como conveniência de navegação, não como segurança.
@Injectable({ providedIn: 'root' })
export class SessaoService {
  readonly cliente = signal<ClienteSessao | null>(this.recuperar());

  constructor() {
    effect(() => this.guardar(this.cliente()));
  }

  entrar(pessoa: Pessoa) {
    this.cliente.set({ idPessoa: pessoa.idPessoa, nome: pessoa.nome });
  }

  sair() {
    this.cliente.set(null);
  }

  private recuperar(): ClienteSessao | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;
      const dados = JSON.parse(bruto) as Partial<ClienteSessao> | null;
      return dados && typeof dados.idPessoa === 'number' && typeof dados.nome === 'string'
        ? { idPessoa: dados.idPessoa, nome: dados.nome }
        : null;
    } catch {
      return null;
    }
  }

  private guardar(cliente: ClienteSessao | null) {
    try {
      if (cliente) {
        localStorage.setItem(CHAVE, JSON.stringify(cliente));
      } else {
        localStorage.removeItem(CHAVE);
      }
    } catch {
      // armazenamento indisponível: a identificação vale só até recarregar a página
    }
  }
}
