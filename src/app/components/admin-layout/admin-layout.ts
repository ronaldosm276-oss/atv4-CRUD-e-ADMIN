import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessaoService } from '../../services/sessao.service';
import { Mensagem } from '../mensagem/mensagem';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Mensagem],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  protected readonly sessao = inject(SessaoService);
  private readonly router = inject(Router);

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

  protected sair() {
    this.sessao.sair();
    this.router.navigate(['/loja']);
  }
}