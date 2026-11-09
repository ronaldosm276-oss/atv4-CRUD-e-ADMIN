namespace AplicacaoBackAula.Servicos
{
    public static class Senhas
    {
        private const int Custo = 12;

        //BCRYPT JA EMBUTE O SALT NO TEXTO DO HASH
        public static string Hash(string senha) => BCrypt.Net.BCrypt.HashPassword(senha, Custo);

        public static bool Verificar(string senha, string hash)
        {
            try { return BCrypt.Net.BCrypt.Verify(senha, hash); }
            catch (Exception) { return false; }
        }
    }
}