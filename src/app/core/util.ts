import { HttpErrorResponse } from '@angular/common/http';

export function mensagemErro(e: HttpErrorResponse): string {
  if (e.status === 0) return 'API indisponível. Verifique se ela está rodando.';
  if (e.error?.mensagem) return e.error.mensagem;
  if (e.error?.errors) return Object.values(e.error.errors).flat().join(' ');
  return `Erro ${e.status}.`;
}

// data local no formato yyyy-MM-dd (evita o problema do UTC)
export function hojeLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}