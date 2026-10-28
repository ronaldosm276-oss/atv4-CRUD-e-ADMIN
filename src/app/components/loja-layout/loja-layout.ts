import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CarrinhoService } from '../../services/carrinho.service';
import { SessaoService } from '../../services/sessao.service';
import { Mensagem } from '../mensagem/mensagem';

@Component({
  selector: 'app-loja-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Mensagem],
  templateUrl: './loja-layout.html',
})
export class LojaLayout {
  protected readonly carrinho = inject(CarrinhoService);
  protected readonly sessao = inject(SessaoService);
}
