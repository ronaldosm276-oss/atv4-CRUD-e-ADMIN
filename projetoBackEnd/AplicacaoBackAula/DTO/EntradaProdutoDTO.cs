namespace AplicacaoBackAula.DTO
{
    public class EntradaProdutoDTO
    {
        //DADOS DA TABELA ENTRADA_PRODUTO
        public int IdEntradaProduto { get; set; }
        public int IdItem { get; set; }
        public DateOnly DataEntradaProduto { get; set; }
        public int QuantidadeEntrada { get; set; }
        public string Unidade { get; set; } = null!;
        public decimal ValorUnitarioEntrada { get; set; }
    }
}