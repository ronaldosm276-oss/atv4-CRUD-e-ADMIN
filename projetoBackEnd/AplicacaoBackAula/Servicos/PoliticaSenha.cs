namespace AplicacaoBackAula.Servicos
{
    public static class PoliticaSenha
    {
        public const int Minimo = 8;
        public const int Maximo = 32;

        private static readonly string[] Comuns =
            { "senha", "password", "qwerty", "admin", "asdfg", "zxcvb", "abc123", "123456", "654321", "loja" };

        //DEVOLVE A MENSAGEM DE ERRO OU null SE A SENHA FOR ACEITA
        //cpf/email (OPCIONAIS): A SENHA NAO PODE CONTER OS DADOS DA PROPRIA PESSOA
        public static string? Validar(string? senha, long? cpf = null, string? email = null)
        {
            if (string.IsNullOrEmpty(senha) || senha.Length < Minimo || senha.Length > Maximo)
                return $"A SENHA DEVE TER DE {Minimo} A {Maximo} CARACTERES!";

            if (!senha.Any(char.IsLetter) || !senha.Any(char.IsDigit))
                return "A SENHA DEVE TER PELO MENOS UMA LETRA E UM NÚMERO!";

            var s = senha.ToLowerInvariant();

            if (EhPadraoRepetido(s))
                return "SENHA MUITO SIMPLES: CARACTERES REPETIDOS!";

            if (TemSequencia(s))
                return "SENHA MUITO SIMPLES: SEQUÊNCIA!";

            if (Comuns.Any(c => s.Contains(c)))
                return "SENHA MUITO COMUM!";

            if (cpf.HasValue && cpf.Value > 0 && s.Contains(cpf.Value.ToString()))
                return "A SENHA NÃO PODE CONTER O CPF!";

            if (!string.IsNullOrWhiteSpace(email))
            {
                var usuario = email.Split('@')[0].ToLowerInvariant();
                if (usuario.Length >= 4 && s.Contains(usuario))
                    return "A SENHA NÃO PODE CONTER O SEU E-MAIL!";
            }

            return null;
        }

        //SEQUENCIA DE 5+ CARACTERES CONSECUTIVOS (12345, abcde, 98765)
        private static bool TemSequencia(string s)
        {
            const int limite = 5;
            var asc = 1; var desc = 1;
            for (var i = 1; i < s.Length; i++)
            {
                asc  = s[i] - s[i - 1] == 1  ? asc + 1  : 1;
                desc = s[i] - s[i - 1] == -1 ? desc + 1 : 1;
                if (asc >= limite || desc >= limite) return true;
            }
            return false;
        }

        //1111, 1212, abab: a senha inteira e um bloco menor repetido
        private static bool EhPadraoRepetido(string s)
        {
            for (var n = 1; n <= s.Length / 2; n++)
            {
                if (s.Length % n == 0 &&
                    string.Concat(Enumerable.Repeat(s[..n], s.Length / n)) == s)
                    return true;
            }
            return false;
        }
    }
}