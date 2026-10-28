export type CodigoStatus = 'A' | 'P' | 'C' | 'X';

export const STATUS_PEDIDO: Record<CodigoStatus, string> = {
  A: 'Aberto', P: 'Em processamento', C: 'Concluído', X: 'Cancelado',
};

// transições que o backend aceita; o front só evita oferecer o que a API vai recusar
const TRANSICOES: Record<CodigoStatus, CodigoStatus[]> = {
  A: ['P', 'X'], P: ['C', 'X'], C: [], X: [],
};

export const ACAO_STATUS: Record<CodigoStatus, string> = {
  A: 'Reabrir', P: 'Processar', C: 'Concluir', X: 'Cancelar',
};

export function rotuloStatus(codigo: string): string {
  return STATUS_PEDIDO[codigo as CodigoStatus] ?? codigo;
}

export function proximosStatus(codigo: string): CodigoStatus[] {
  return TRANSICOES[codigo as CodigoStatus] ?? [];
}
