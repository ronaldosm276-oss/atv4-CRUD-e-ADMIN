import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { CrudService } from './crud.service';
import { Atendimento, AtendimentoEnvio } from './models';
import { CodigoStatus } from './status';

@Injectable({ providedIn: 'root' })
export class AtendimentoService extends CrudService<Atendimento, AtendimentoEnvio> {
  constructor() { super('Atendimento'); }

  filtrar(filtro: { idPessoa?: number; status?: string }) {
    let params = new HttpParams();
    if (filtro.idPessoa !== undefined) params = params.set('idPessoa', filtro.idPessoa);
    if (filtro.status) params = params.set('status', filtro.status);
    return this.http.get<Atendimento[]>(this.url, { params });
  }

  mudarStatus(id: number, status: CodigoStatus) {
    return this.http.put<void>(`${this.url}/${id}/status`, { status });
  }
}
