namespace AplicacaoBackAula.DTO
{
    public class EstoqueRespostaDTO
    {
        public int IdItem { get; set; }
        public string? Item { get; set; }
        public string? DescricaoItem { get; set; }
        public decimal Preco { get; set; }
        public decimal PrecoVenda { get; set; }
        public string? Unidade { get; set; }
        public string? Categoria { get; set; }
        public int QuantidadeEstoque { get; set; }
        public string? AtivoProdutoServico { get; set; }
    }
}