import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../utils/api.config';

export const LIMITE_IMAGEM = 2 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

// o servidor confere de novo pelos bytes do arquivo; aqui e so para avisar antes de enviar
export function validarImagem(arquivo: File): string | null {
  if (!TIPOS.includes(arquivo.type)) return 'Formato inválido. Envie JPG, PNG ou WebP.';
  if (arquivo.size > LIMITE_IMAGEM) return 'A imagem deve ter no máximo 2 MB.';
  return null;
}

@Injectable({ providedIn: 'root' })
export class ImagemItemService {
  private readonly http = inject(HttpClient);

  enviar(idItem: number, arquivo: File) {
    const dados = new FormData();
    dados.append('arquivo', arquivo);
    return this.http.post<{ imagemUrl: string }>(`${API_URL}/Item/${idItem}/imagem`, dados);
  }

  remover(idItem: number) {
    return this.http.delete<void>(`${API_URL}/Item/${idItem}/imagem`);
  }
}