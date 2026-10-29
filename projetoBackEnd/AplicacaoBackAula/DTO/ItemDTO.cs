namespace AplicacaoBackAula.DTO
{
    public class ItemDTO
    {
        //DADOS DA TABELA ITEM
        public int IdItem { get; set; }
        public int IdCategoria { get; set; }
        public string Item { get; set; } = null!;
        public string DescricaoItem { get; set; } = null!;
        public decimal Preco { get; set; }
        public string TipoItem { get; set; } = null!;
        public string AtivoProdutoServico { get; set; } = null!;

        //SOMENTE LEITURA: PREENCHIDO NAS RESPOSTAS E IGNORADO NA ENTRADA
        public string? Categoria { get; set; }
    }
}