import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MensagemService } from '../../services/mensagem.service';
import { SessaoService } from '../../services/sessao.service';
import { Identificacao } from '../identificacao/identificacao';

@Component({
  selector: 'app-entrar',
  imports: [Identificacao],
  template: `
    <h1>Entrar</h1>
    <section class="painel">
      <app-identificacao (identificado)="continuar()" />
    </section>
  `,
})
export class Entrar {
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly sessao = inject(SessaoService);
  private readonly mensagens = inject(MensagemService);

  protected continuar() {
    const retorno = this.rota.snapshot.queryParamMap.get('retorno') ?? '/loja';
    const interno = retorno.startsWith('/') && !retorno.startsWith('//'); // so rotas internas
    if (interno && retorno.startsWith('/admin') && !this.sessao.ehFuncionario()) {
      this.mensagens.erro('Esta conta não tem acesso ao painel administrativo.');
      this.router.navigateByUrl('/loja');
      return;
    }
    this.router.navigateByUrl(interno ? retorno : '/loja');
  }
}