import { Injectable, signal } from '@angular/core';

export interface Aviso { texto: string; tipo: 'sucesso' | 'erro'; }

@Injectable({ providedIn: 'root' })
export class MensagemService {
  readonly atual = signal<Aviso | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  sucesso(texto: string) { this.mostrar({ texto, tipo: 'sucesso' }); }
  erro(texto: string) { this.mostrar({ texto, tipo: 'erro' }); }

  fechar() {
    clearTimeout(this.temporizador);
    this.atual.set(null);
  }

  private mostrar(aviso: Aviso) {
    clearTimeout(this.temporizador);
    this.atual.set(aviso);
    this.temporizador = setTimeout(() => this.atual.set(null), 5000);
  }
}
