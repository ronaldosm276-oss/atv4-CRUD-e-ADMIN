namespace AplicacaoBackAula.DTO
{
    public class AtendimentoItemDTO
    {
        //DADOS PRÓPRIOS DA ENTIDADE ASSOCIATIVA ATENDIMENTOITEM
        public int IdItem { get; set; }
        public int IdFuncionario { get; set; }
        public int QuantidadeItens { get; set; }
        public decimal ValorUnitario { get; set; }
    }
}