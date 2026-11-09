using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly BdAulaBackendContext _context;
        private readonly TokenService _tokens;

        public AuthController(BdAulaBackendContext context, TokenService tokens)
        {
            _context = context;
            _tokens = tokens;
        }

        //LOGIN POR CPF OU E-MAIL; A MENSAGEM DE ERRO E SEMPRE A MESMA, SEM REVELAR QUAL CAMPO ESTAVA ERRADO
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<LoginRespostaDTO>> Login(LoginDTO dto)
        {
            var generica = new { mensagem = "CPF/E-MAIL OU SENHA INVÁLIDOS!" };

            if (string.IsNullOrWhiteSpace(dto.Login) || string.IsNullOrEmpty(dto.Senha))
                return Unauthorized(generica);

            var login = dto.Login.Trim();
            Pessoa? pessoa;

            if (login.Contains('@'))
            {
                pessoa = await _context.Pessoas.FirstOrDefaultAsync(p => p.Email == login);
            }
            else
            {
                var digitos = new string(login.Where(char.IsDigit).ToArray());
                if (!ulong.TryParse(digitos, out var cpf) || cpf == 0)
                    return Unauthorized(generica);

                pessoa = await _context.Pessoas.FirstOrDefaultAsync(p => p.Cpf == cpf);
            }

            var credencial = pessoa == null
                ? null
                : await _context.Credenciais.FindAsync(pessoa.Idpessoa);

            if (pessoa == null || credencial == null ||
                !Senhas.Verificar(dto.Senha, credencial.SenhaHash) ||
                pessoa.AtivoPessoa != "S")
                return Unauthorized(generica);

            //O PERFIL VEM DE EXISTIR LINHA EM funcionario
            var ehFuncionario = await _context.Funcionarios.AnyAsync(f => f.Idpessoa == pessoa.Idpessoa);
            var perfil = ehFuncionario ? "Funcionario" : "Cliente";

            var (token, expira) = _tokens.Gerar(pessoa.Idpessoa, pessoa.Nome, perfil);

            return Ok(new LoginRespostaDTO
            {
                Token = token,
                ExpiraEm = expira,
                IdPessoa = pessoa.Idpessoa,
                Nome = pessoa.Nome,
                Perfil = perfil
            });
        }

        //SENHA ATUAL ERRADA RETORNA 400 (NAO 401), PARA O FRONT NAO CONFUNDIR COM TOKEN EXPIRADO
        [Authorize]
        [HttpPost("alterar-senha")]
        public async Task<IActionResult> AlterarSenha(AlterarSenhaDTO dto)
        {
            var credencial = await _context.Credenciais.FindAsync(User.IdPessoa());

            if (credencial == null || !Senhas.Verificar(dto.SenhaAtual ?? "", credencial.SenhaHash))
                return BadRequest(new { mensagem = "SENHA ATUAL INCORRETA!" });

            var erro = PoliticaSenha.Validar(dto.NovaSenha);
            if (erro != null)
                return BadRequest(new { mensagem = erro });

            credencial.SenhaHash = Senhas.Hash(dto.NovaSenha);
            credencial.AtualizadaEm = DateTime.Now;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}