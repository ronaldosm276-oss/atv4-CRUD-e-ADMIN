namespace AplicacaoBackAula.DTO
{
    public class AtendimentoItemRespostaDTO
    {
        public int IdItem { get; set; }
        public string Item { get; set; } = null!;
        public int IdFuncionario { get; set; }
        public string Funcionario { get; set; } = null!;
        public int QuantidadeItens { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}