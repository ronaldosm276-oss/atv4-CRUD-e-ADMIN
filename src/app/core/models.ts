export interface Categoria { idcategoria: number; categoria: string; }

export interface Item {
  idItem: number; idCategoria: number; item: string; descricaoItem: string;
  preco: number; tipoItem: string; ativoProdutoServico: string; categoria?: string;
}

// leitura (GET /api/ProdutoItem)
export interface ProdutoLeitura {
  iditem: number; codigoPreco: number; precoVenda: number; unidade: string;
  iditemNavigation: {
    iditem: number; idcategoria: number; item1: string; descricaoItem: string;
    preco: number; tipoItem: string; ativoProdutoServico: string;
  };
}
// envio (POST/PUT)
export interface ProdutoEnvio {
  idCategoria: number; item: string; descricaoItem: string; preco: number;
  tipoItem: string; ativoProdutoServico: string;
  codigoPreco: number; precoVenda: number; unidade: string;
}

export interface Endereco { idEndereco: number; idPessoa: number; cep: string; numero: string; complemento: string; }
export interface Pessoa {
  idPessoa: number; nome: string; cpf: number; dataNascimento: string; sexo: string;
  email: string; telefone: number; ativoPessoa: string; enderecos: Endereco[];
}
export interface Funcionario extends Pessoa { cargo: string; dataAdmissao: string; }

export interface AtendimentoItemEnvio { idItem: number; idFuncionario: number; quantidadeItens: number; valorUnitario: number; }
export interface AtendimentoEnvio { idAtendimento: number; idPessoa: number; dataAtendimento: string; statusAtendimento: string; itens: AtendimentoItemEnvio[]; }
export interface AtendimentoItemResposta {
  idItem: number; item: string; idFuncionario: number; funcionario: string;
  quantidadeItens: number; valorUnitario: number; subtotal: number;
}
export interface Atendimento {
  idAtendimento: number; dataAtendimento: string; statusAtendimento: string;
  idPessoa: number; pessoa: string; itens: AtendimentoItemResposta[]; valorTotal: number;
}

export interface EntradaEnvio { idEntradaProduto: number; idItem: number; dataEntradaProduto: string; quantidadeEntrada: number; unidade: string; valorUnitarioEntrada: number; }
export interface EntradaResposta extends EntradaEnvio { item: string; quantidadeEstoqueAtual: number; precoVenda: number; }