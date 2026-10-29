namespace AplicacaoBackAula.DTO
{
    public class FuncionarioDTO : PessoaDTO
    {
        public string Cargo { get; set; } = null!;

        public DateOnly DataAdmissao { get; set; } 
    }
}
