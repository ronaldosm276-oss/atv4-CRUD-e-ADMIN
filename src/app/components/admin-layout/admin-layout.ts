import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Mensagem } from '../mensagem/mensagem';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Mensagem],
  templateUrl: './admin-layout.html',
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
