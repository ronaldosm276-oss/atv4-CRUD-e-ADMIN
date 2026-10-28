import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Mensagem } from '../shared/mensagem';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Mensagem],
  template: `
    <header class="topo">
      <a routerLink="/admin" class="marca">minhaloja · administração</a>
      <nav>
        @for (i of itens; track i.rota) {
          <a [routerLink]="'/admin/' + i.rota" routerLinkActive="ativo"
             [routerLinkActiveOptions]="{ exact: i.rota === '' }">{{ i.rotulo }}</a>
        }
        <a routerLink="/loja">Ir para a loja</a>
      </nav>
    </header>
    <main class="conteudo"><router-outlet /></main>
    <app-mensagem />
  `,
})
export class AdminLayout {
  protected readonly itens = [
    { rota: '', rotulo: 'Início' },
    { rota: 'clientes', rotulo: 'Clientes' },
    { rota: 'categorias', rotulo: 'Categorias' },
    { rota: 'produtos', rotulo: 'Produtos' },
    { rota: 'servicos', rotulo: 'Serviços' },
    { rota: 'funcionarios', rotulo: 'Funcionários' },
    { rota: 'pedidos', rotulo: 'Pedidos' },
    { rota: 'entradas', rotulo: 'Entrada de produtos' },
    { rota: 'estoque', rotulo: 'Estoque' },
  ];
}
