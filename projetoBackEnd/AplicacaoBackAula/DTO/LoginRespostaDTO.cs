namespace AplicacaoBackAula.DTO
{
    public class LoginRespostaDTO
    {
        public string Token { get; set; } = "";
        public DateTime ExpiraEm { get; set; }
        public int IdPessoa { get; set; }
        public string Nome { get; set; } = "";
        public string Perfil { get; set; } = "";
    }
}