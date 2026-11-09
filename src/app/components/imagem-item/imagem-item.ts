import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ImagemItemService, validarImagem } from '../../services/imagem-item.service';
import { MensagemService } from '../../services/mensagem.service';
import { urlImagem } from '../../utils/api.config';
import { mensagemErro } from '../../utils/util';

@Component({
  selector: 'app-imagem-item',
  template: `
    <div class="imagem-item">
      <div class="moldura">
        @if (src(); as s) {
          <img [src]="s" [alt]="'Imagem de ' + nome()" loading="lazy">
        } @else {
          <span>Sem imagem</span>
        }
      </div>
      <div class="botoes">
        <button type="button" class="botao secundario pequeno" [disabled]="enviando()" (click)="seletor.click()">
          {{ enviando() ? 'Enviando...' : (src() ? 'Trocar' : 'Enviar') }}
        </button>
        @if (src()) {
          <button type="button" class="botao secundario pequeno" [disabled]="enviando()" (click)="remover()">Remover</button>
        }
        <input #seletor type="file" hidden accept="image/jpeg,image/png,image/webp" (change)="escolher($event)">
      </div>
      <small class="dica">JPG, PNG ou WebP · máx. 2 MB</small>
    </div>
  `,
  styles: `
    .imagem-item { display: grid; gap: .35rem; justify-items: start; }
    .moldura { width: 84px; height: 84px; border: 1px solid #d9d2ee; border-radius: 8px; background: #f3f0fa;
      display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: .75rem; color: #7a6e99; }
    .moldura img { width: 100%; height: 100%; object-fit: cover; }
    .botoes { display: flex; gap: .35rem; flex-wrap: wrap; }
    .dica { font-size: .7rem; color: #7a6e99; }
  `,
})
export class ImagemItem {
  private readonly api = inject(ImagemItemService);
  private readonly mensagens = inject(MensagemService);

  readonly idItem = input.required<number>();
  readonly nome = input('');
  readonly imagemUrl = input<string | null | undefined>(null);
  readonly alterada = output<string | null>();

  protected readonly enviando = signal(false);
  protected readonly src = computed(() => urlImagem(this.imagemUrl()));

  protected escolher(evento: Event) {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo) return;

    const erro = validarImagem(arquivo);
    if (erro) {
      this.mensagens.erro(erro);
      return;
    }

    this.enviando.set(true);
    this.api.enviar(this.idItem(), arquivo).subscribe({
      next: r => {
        this.enviando.set(false);
        this.mensagens.sucesso('Imagem salva.');
        this.alterada.emit(r.imagemUrl);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }

  protected remover() {
    if (!confirm('Remover a imagem deste item?')) return;
    this.enviando.set(true);
    this.api.remover(this.idItem()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensagens.sucesso('Imagem removida.');
        this.alterada.emit(null);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.mensagens.erro(mensagemErro(e));
      },
    });
  }
}