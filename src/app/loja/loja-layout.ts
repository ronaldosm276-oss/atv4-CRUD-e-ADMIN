import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CarrinhoService } from '../core/carrinho.service';
import { SessaoService } from '../core/sessao.service';
import { Mensagem } from '../shared/mensagem';

@Component({
  selector: 'app-loja-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Mensagem],
  template: `
    <header class="topo">
      <a routerLink="/loja" class="marca">minhaloja</a>
      <nav>
        <a routerLink="/loja" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }">Loja</a>
        <a routerLink="/loja/cadastro" routerLinkActive="ativo">Cadastro</a>
        <a routerLink="/loja/pedidos" routerLinkActive="ativo">Meus pedidos</a>
        <a routerLink="/loja/carrinho" routerLinkActive="ativo">
          Carrinho
          @if (carrinho.quantidadeTotal() > 0) {
            <span class="contador">{{ carrinho.quantidadeTotal() }}</span>
          }
        </a>
        <a routerLink="/admin">Administração</a>
        @if (sessao.cliente(); as c) {
          <span class="cliente">Olá, {{ c.nome.split(' ')[0] }}</span>
          <button type="button" class="sair" (click)="sessao.sair()">Sair</button>
        }
      </nav>
    </header>
    <main class="conteudo"><router-outlet /></main>
    <footer class="rodape">© 2026 Minha Loja. Todos os direitos reservados.</footer>
    <app-mensagem />
  `,
})
export class LojaLayout {
  protected readonly carrinho = inject(CarrinhoService);
  protected readonly sessao = inject(SessaoService);
}
