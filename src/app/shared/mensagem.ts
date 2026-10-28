import { Component, inject } from '@angular/core';
import { MensagemService } from '../core/mensagem.service';

@Component({
  selector: 'app-mensagem',
  template: `
    @if (servico.atual(); as aviso) {
      <div class="aviso" [class.erro]="aviso.tipo === 'erro'" role="alert" (click)="servico.fechar()">
        {{ aviso.texto }}
      </div>
    }
  `,
  styles: `
    .aviso { position: fixed; right: 1rem; bottom: 1rem; max-width: 22rem; padding: .75rem 1rem;
      border-radius: 6px; background: #234038; color: #fff; cursor: pointer; z-index: 10; }
    .aviso.erro { background: #b00020; }
  `,
})
export class Mensagem {
  protected readonly servico = inject(MensagemService);
}
