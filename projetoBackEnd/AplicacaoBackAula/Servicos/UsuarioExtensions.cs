namespace AplicacaoBackAula.Servicos
{
    public static class UsuarioExtensions
    {
        public static int IdPessoa(this ClaimsPrincipal usuario) =>
            int.TryParse(usuario.FindFirst("sub")?.Value, out var id) ? id : 0;

        public static bool EhFuncionario(this ClaimsPrincipal usuario) =>
            usuario.IsInRole("Funcionario");
    }
}