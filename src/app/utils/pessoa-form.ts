import { NonNullableFormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Endereco } from '../models/models';
import { cepValido } from './validadores';

// a data de admissão segue a mesma regra da data de nascimento: não pode ser futura
export { dataNascimentoValida as dataNaoFutura } from './validadores';

// um endereço do formulário; idEndereco 0 = endereço novo (a API só atualiza os que chegam com id)
export function grupoEndereco(fb: NonNullableFormBuilder, e?: Endereco) {
  return fb.group({
    idEndereco: [e?.idEndereco ?? 0],
    cep: [e?.cep ?? '', [Validators.required, cepValido]],
    numero: [(e?.numero ?? '').trim(), [Validators.required, Validators.maxLength(10)]],
    complemento: [e?.complemento ?? '', [Validators.required, Validators.maxLength(150)]],
  });
}

export function textoErro(e: ValidationErrors | null): string {
  if (!e) return '';
  if (e['required']) return 'Campo obrigatório.';
  if (e['email']) return 'E-mail inválido.';
  if (e['maxlength']) return `Máximo de ${e['maxlength'].requiredLength} caracteres.`;
  if (e['cpf']) return 'CPF inválido.';
  if (e['telefone']) return 'Informe o telefone com DDD (10 ou 11 dígitos).';
  if (e['cep']) return 'O CEP deve ter 8 dígitos.';
  if (e['futura']) return 'A data não pode ser futura.';
  if (e['data']) return 'Data inválida.';
  return 'Valor inválido.';
}

// CPF e telefone são BIGINT no banco: o zero à esquerda se perde, então recompõe ao exibir
export function formatarCpf(cpf: number): string {
  const d = String(cpf).padStart(11, '0');
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatarTelefone(telefone: number): string {
  const d = String(telefone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}
