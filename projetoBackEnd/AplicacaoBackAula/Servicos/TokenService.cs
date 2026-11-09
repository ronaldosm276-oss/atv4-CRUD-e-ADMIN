using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AplicacaoBackAula.Servicos
{
    public class TokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public (string Token, DateTime ExpiraEm) Gerar(int idPessoa, string nome, string perfil)
        {
            var chave = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key nao configurada (use dotnet user-secrets).");
            var horas = int.TryParse(_config["Jwt:Horas"], out var h) ? h : 8;
            var expira = DateTime.UtcNow.AddHours(horas);

            var credenciais = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chave)), SecurityAlgorithms.HmacSha256);

            //NOMES CURTOS DE CLAIM: O Program.cs LE "sub", "name" E "role" SEM MAPEAMENTO
            var claims = new[]
            {
                new Claim("sub", idPessoa.ToString()),
                new Claim("name", nome),
                new Claim("role", perfil)
            };

            var jwt = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: expira,
                signingCredentials: credenciais);

            return (new JwtSecurityTokenHandler().WriteToken(jwt), expira);
        }
    }
}