namespace AplicacaoBackAula.DTO
{
    public class AtendimentoRespostaDTO
    {
        public int IdAtendimento { get; set; }
        public DateOnly DataAtendimento { get; set; }
        public string StatusAtendimento { get; set; } = null!;
        public int IdPessoa { get; set; }
        public string Pessoa { get; set; } = null!;
        public List<AtendimentoItemRespostaDTO> Itens { get; set; } = new();
        public decimal ValorTotal { get; set; }
    }
}