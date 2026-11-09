export type Perfil = 'Cliente' | 'Funcionario';

export interface LoginResposta {
  token: string;
  expiraEm: string;
  idPessoa: number;
  nome: string;
  perfil: Perfil;
}