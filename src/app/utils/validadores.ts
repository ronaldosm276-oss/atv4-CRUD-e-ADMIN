import { AbstractControl, ValidationErrors } from '@angular/forms';
import { hojeLocal } from './util';

export function soDigitos(valor: unknown): string {
  return String(valor ?? '').replace(/\D/g, '');
}

// campo vazio fica por conta do Validators.required
export function cpfValido(c: AbstractControl): ValidationErrors | null {
  const cpf = soDigitos(c.value);
  if (!cpf) return null;
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return { cpf: true };

  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]) ? null : { cpf: true };
}

export function telefoneValido(c: AbstractControl): ValidationErrors | null {
  const t = soDigitos(c.value);
  if (!t) return null;
  return t.length === 10 || t.length === 11 ? null : { telefone: true };
}

export function cepValido(c: AbstractControl): ValidationErrors | null {
  const cep = soDigitos(c.value);
  if (!cep) return null;
  return cep.length === 8 ? null : { cep: true };
}

// a API rejeita data futura; o front avisa antes de enviar
export function dataNascimentoValida(c: AbstractControl): ValidationErrors | null {
  const data = String(c.value ?? '');
  if (!data) return null;
  if (data > hojeLocal()) return { futura: true };
  if (data < '1900-01-01') return { data: true };
  return null;
}

// no maximo 2 casas decimais (colunas DECIMAL(10,2); a API recusa mais que isso)
export function duasCasas(c: AbstractControl): ValidationErrors | null {
  const valor = c.value;
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6 ? null : { casas: true };
}
