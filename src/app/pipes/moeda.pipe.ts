import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'moeda' })
export class Moeda implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
