namespace AplicacaoBackAula.DTO
{
    public class EntradaProdutoRespostaDTO
    {
        //DADOS DA ENTRADA
        public int IdEntradaProduto { get; set; }
        public int IdItem { get; set; }
        public DateOnly DataEntradaProduto { get; set; }
        public int QuantidadeEntrada { get; set; }
        public string Unidade { get; set; } = null!;
        public decimal ValorUnitarioEntrada { get; set; }

        //DADOS RELACIONADOS, SOMENTE LEITURA
        public string Item { get; set; } = null!;
        public int QuantidadeEstoqueAtual { get; set; }
        public decimal PrecoVenda { get; set; }
    }
}