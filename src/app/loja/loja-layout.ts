import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
        <a routerLink="/loja/carrinho" routerLinkActive="ativo">Carrinho</a>
        <a routerLink="/admin">Administração</a>
      </nav>
    </header>
    <main class="conteudo"><router-outlet /></main>
    <footer class="rodape">© 2026 Minha Loja. Todos os direitos reservados.</footer>
    <app-mensagem />
  `,
})
export class LojaLayout {}
