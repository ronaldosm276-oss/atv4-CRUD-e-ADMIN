import { Component, inject } from '@angular/core';
import { MensagemService } from '../../services/mensagem.service';

@Component({
  selector: 'app-mensagem',
  templateUrl: './mensagem.html',
  styleUrl: './mensagem.css',
})
export class Mensagem {
  protected readonly servico = inject(MensagemService);
}
