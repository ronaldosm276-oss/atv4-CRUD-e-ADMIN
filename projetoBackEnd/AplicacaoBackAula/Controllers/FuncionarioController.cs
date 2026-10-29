using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FuncionarioController : ControllerBase
    {
        //declaração do atributo de contexto
        private readonly BdAulaBackendContext _context;
        //declaração do método construtor
        public FuncionarioController(BdAulaBackendContext context)
        {
            _context = context;
        }

        //DECLARAÇÃO DO MÉTODO PARA LISTAR TODOS OS FUNCIONÁRIOS
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FuncionarioDTO>>> GetAll()
        {
            var funcionarios = await _context.Funcionarios
                .Select(f => new FuncionarioDTO
                {
                    IdPessoa = f.Idpessoa,
                    Nome = f.IdpessoaNavigation.Nome,
                    CPF = (long)f.IdpessoaNavigation.Cpf,
                    DataNascimento = f.IdpessoaNavigation.DataNascimento,
                    sexo = f.IdpessoaNavigation.Sexo,
                    email = f.IdpessoaNavigation.Email,
                    telefone = (long)f.IdpessoaNavigation.Telefone,
                    AtivoPessoa = f.IdpessoaNavigation.AtivoPessoa,
                 

                    Cargo = f.Cargo,
                    DataAdmissao = f.DataAdmissao,

                    Enderecos = f.IdpessoaNavigation.Enderecos.Select(e => new EnderecoDTO
                    {
                        IdEndereco = e.Idendereco,
                        IdPessoa = e.Idpessoa,
                        CEP = e.Cep,
                        Numero = e.Numero,
                        Complemento = e.Complemento,

                    }).ToList()

                }).ToListAsync();

            return Ok(funcionarios);

        }//FIM MÉTODO GetAll
        [HttpGet("{id}")]
        public async Task<ActionResult<FuncionarioDTO>> GetFuncionario(int id)
        {
            var funcionario = await _context.Funcionarios
              .Where(f => f.Idpessoa == id)
             .Select(f => new FuncionarioDTO
      {
                    IdPessoa = f.Idpessoa,
                    Nome = f.IdpessoaNavigation.Nome,
                    CPF = (long)f.IdpessoaNavigation.Cpf,
                    DataNascimento = f.IdpessoaNavigation.DataNascimento,
                    sexo = f.IdpessoaNavigation.Sexo,
                    email = f.IdpessoaNavigation.Email,
                    telefone = (long)f.IdpessoaNavigation.Telefone,
                    AtivoPessoa = f.IdpessoaNavigation.AtivoPessoa,


                    Cargo = f.Cargo,
                    DataAdmissao = f.DataAdmissao,

                    Enderecos = f.IdpessoaNavigation.Enderecos.Select(e => new EnderecoDTO
                    {
                        IdEndereco = e.Idendereco,
                        IdPessoa = e.Idpessoa,
                        CEP = e.Cep,
                        Numero = e.Numero,
                        Complemento = e.Complemento,

                    }).ToList()

                }).FirstOrDefaultAsync();

            if (funcionario == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "FUNCIONÁRIO NÃO LOCALIZADO!"
                    });
            }

            return Ok(funcionario);

        }
        //DECLARAÇÃO DO MÉTODO PARA CADASTRAR UM FUNCIONÁRIO
        [HttpPost]
        public async Task<ActionResult<FuncionarioDTO>> Post(FuncionarioDTO dto)
        {
            //VALIDA OS DADOS ANTES DE GRAVAR (CADASTRO EXIGE PELO MENOS UM ENDEREÇO)
            var erro = ValidarFuncionario(dto, true);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            //IMPEDE CPF E E-MAIL DUPLICADOS
            var cpfBanco = (ulong)dto.CPF;

            if (await _context.Pessoas.AnyAsync(p => p.Cpf == cpfBanco))
            {
                return Conflict(new { mensagem = "CPF JÁ CADASTRADO!" });
            }

            if (await _context.Pessoas.AnyAsync(p => p.Email == dto.email))
            {
                return Conflict(new { mensagem = "E-MAIL JÁ CADASTRADO!" });
            }

            //PROJETA OS DADOS DO DTO PARA O MODELO Pessoa, JÁ COM OS ENDEREÇOS E O FUNCIONÁRIO DENTRO
            var pessoa = new Pessoa
            {
                Nome = dto.Nome!,
                Cpf = (ulong)dto.CPF,
                DataNascimento = dto.DataNascimento,
                Sexo = dto.sexo,
                Email = dto.email,
                Telefone = (ulong)dto.telefone,
                AtivoPessoa = dto.AtivoPessoa,

                

                Enderecos = dto.Enderecos.Select(e => new Endereco
                {
                    Cep = e.CEP,
                    Numero = e.Numero,
                    Complemento = e.Complemento
                }).ToList(),

                Funcionario = new Funcionario
                {
                    Cargo = dto.Cargo,
                    DataAdmissao = dto.DataAdmissao,
                }
            };

            //UM ÚNICO SaveChanges GRAVA AS TRÊS TABELAS NA MESMA TRANSAÇÃO
            _context.Pessoas.Add(pessoa);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { mensagem = "NÃO FOI POSSÍVEL GRAVAR! VERIFIQUE OS DADOS INFORMADOS." });
            }

            //DEVOLVE OS DADOS COM OS IDS QUE O BANCO GEROU
            dto.IdPessoa = pessoa.Idpessoa;
            dto.Enderecos = pessoa.Enderecos.Select(e => new EnderecoDTO
            {
                IdEndereco = e.Idendereco,
                IdPessoa = e.Idpessoa,
                CEP = e.Cep,
                Numero = e.Numero,
                Complemento = e.Complemento
            }).ToList();

            return CreatedAtAction(
                nameof(GetFuncionario),
                new { id = pessoa.Idpessoa },
                dto);

        }//FIM MÉTODO Post
         //DECLARAÇÃO DO MÉTODO PARA ATUALIZAR UM FUNCIONÁRIO
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, FuncionarioDTO dto)
        {
            //VALIDA OS DADOS ANTES DE BUSCAR NO BANCO
            var erro = ValidarFuncionario(dto, false);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            //BUSCA O FUNCIONÁRIO COM A PESSOA E OS ENDEREÇOS, JÁ RASTREADOS PELO CONTEXTO
            var funcionario = await _context.Funcionarios
                .Include(f => f.IdpessoaNavigation)
                    .ThenInclude(p => p.Enderecos)
                .FirstOrDefaultAsync(f => f.Idpessoa == id);

            //VERIFICA SE O FUNCIONÁRIO EXISTE
            if (funcionario == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "FUNCIONÁRIO NÃO LOCALIZADO!"
                    });
            }
            //IMPEDE CPF E E-MAIL DUPLICADOS (IGNORA A PRÓPRIA PESSOA)
            var cpfBanco = (ulong)dto.CPF;

            if (await _context.Pessoas.AnyAsync(p => p.Cpf == cpfBanco && p.Idpessoa != id))
            {
                return Conflict(new { mensagem = "CPF JÁ CADASTRADO!" });
            }

            if (await _context.Pessoas.AnyAsync(p => p.Email == dto.email && p.Idpessoa != id))
            {
                return Conflict(new { mensagem = "E-MAIL JÁ CADASTRADO!" });
            }
            var pessoa = funcionario.IdpessoaNavigation;

            //COPIA OS DADOS DE PESSOA
            pessoa.Nome = dto.Nome!;
            pessoa.Cpf = (ulong)dto.CPF;
            pessoa.DataNascimento = dto.DataNascimento;
            pessoa.Sexo = dto.sexo;
            pessoa.Email = dto.email;
            pessoa.Telefone = (ulong)dto.telefone;
            pessoa.AtivoPessoa = dto.AtivoPessoa;

            //COPIA OS DADOS DE FUNCIONÁRIO
            funcionario.Cargo = dto.Cargo;
            funcionario.DataAdmissao = dto.DataAdmissao;

            //PERCORRE OS ENDEREÇOS ENVIADOS
            foreach (var endDto in dto.Enderecos)
            {
                //SE VEIO IdEndereco, O ENDEREÇO JÁ EXISTE E SERÁ ATUALIZADO
                if (endDto.IdEndereco > 0)
                {
                    //BUSCA SOMENTE ENTRE OS ENDEREÇOS DESTA PESSOA
                    var endereco = pessoa.Enderecos
                        .FirstOrDefault(e => e.Idendereco == endDto.IdEndereco);

                    if (endereco == null)
                    {
                        return BadRequest(
                            new
                            {
                                mensagem = "O ENDEREÇO " + endDto.IdEndereco + " NÃO PERTENCE A ESTE FUNCIONÁRIO!"
                            });
                    }

                    endereco.Cep = endDto.CEP;
                    endereco.Numero = endDto.Numero;
                    endereco.Complemento = endDto.Complemento ?? string.Empty;
                }
                //SE NÃO VEIO IdEndereco, É UM ENDEREÇO NOVO
                else
                {
                    pessoa.Enderecos.Add(new Endereco
                    {
                        Cep = endDto.CEP,
                        Numero = endDto.Numero,
                        Complemento = endDto.Complemento ?? string.Empty
                    });
                }
            }

            //UM ÚNICO SaveChanges GRAVA PESSOA, FUNCIONÁRIO E ENDEREÇOS NA MESMA TRANSAÇÃO
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { mensagem = "NÃO FOI POSSÍVEL ATUALIZAR! VERIFIQUE OS DADOS INFORMADOS." });
            }

            return NoContent();

        }//FIM MÉTODO Put
         //DECLARAÇÃO DO MÉTODO PARA EXCLUIR UM FUNCIONÁRIO
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            //BUSCA O FUNCIONÁRIO COM A PESSOA E OS ENDEREÇOS
            var funcionario = await _context.Funcionarios
                .Include(f => f.IdpessoaNavigation)
                    .ThenInclude(p => p.Enderecos)
                .FirstOrDefaultAsync(f => f.Idpessoa == id);

            //VERIFICA SE O FUNCIONÁRIO EXISTE
            if (funcionario == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "FUNCIONÁRIO NÃO LOCALIZADO!"
                    });
            }

            //VERIFICA SE O FUNCIONÁRIO EXECUTOU ITENS EM ATENDIMENTOS (FK atendimentoitem.idfuncionario)
            bool executouItens = await _context.Atendimentoitems
                .AnyAsync(ai => ai.Idfuncionario == id);

            //VERIFICA SE A PESSOA FOI CLIENTE EM ATENDIMENTOS (FK atendimento.idpessoa)
            bool foiCliente = await _context.Atendimentos
                .AnyAsync(a => a.Idpessoa == id);

            if (executouItens || foiCliente)
            {
                return Conflict(
                    new
                    {
                        mensagem = "NÃO É POSSÍVEL EXCLUIR: O FUNCIONÁRIO POSSUI ATENDIMENTOS VINCULADOS!"
                    });
            }

            //REMOVE NA ORDEM DOS FILHOS PARA O PAI: ENDEREÇOS, FUNCIONÁRIO E PESSOA
            _context.Enderecos.RemoveRange(funcionario.IdpessoaNavigation.Enderecos);
            _context.Funcionarios.Remove(funcionario);
            _context.Pessoas.Remove(funcionario.IdpessoaNavigation);

            //UM ÚNICO SaveChanges EXECUTA OS TRÊS DELETE NA MESMA TRANSAÇÃO
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                //REDE DE SEGURANÇA: ALGUÉM CRIOU UM VÍNCULO ENTRE O AnyAsync E O SaveChanges
                return Conflict(new { mensagem = "NÃO É POSSÍVEL EXCLUIR: EXISTEM REGISTROS VINCULADOS AO FUNCIONÁRIO!" });
            }

            return NoContent();

        }//FIM MÉTODO Delete 
         //MÉTODO PRIVADO DE VALIDAÇÃO: DEVOLVE A MENSAGEM DE ERRO OU null SE ESTIVER TUDO CERTO
        private static string? ValidarFuncionario(FuncionarioDTO dto, bool exigirEndereco)
        {
            var hoje = DateOnly.FromDateTime(DateTime.Today);

            //DADOS DE PESSOA
            if (string.IsNullOrWhiteSpace(dto.Nome) || dto.Nome.Length > 100)
                return "NOME OBRIGATÓRIO E COM ATÉ 100 CARACTERES!";

            if (dto.CPF <= 0 || dto.CPF > 99999999999)
                return "CPF INVÁLIDO! INFORME ATÉ 11 DÍGITOS NUMÉRICOS.";

            if (dto.DataNascimento == default || dto.DataNascimento > hoje)
                return "DATA DE NASCIMENTO INVÁLIDA!";

            if (dto.sexo != "M" && dto.sexo != "F")
                return "SEXO DEVE SER M OU F!";

            if (string.IsNullOrWhiteSpace(dto.email) || dto.email.Length > 100 || !dto.email.Contains('@'))
                return "E-MAIL INVÁLIDO!";

            if (dto.telefone <= 0 || dto.telefone > 99999999999)
                return "TELEFONE INVÁLIDO! INFORME ATÉ 11 DÍGITOS NUMÉRICOS.";

            if (dto.AtivoPessoa != "S" && dto.AtivoPessoa != "N")
                return "ATIVO DEVE SER S OU N!";

            //DADOS DE FUNCIONÁRIO
            if (string.IsNullOrWhiteSpace(dto.Cargo) || dto.Cargo.Length > 20)
                return "CARGO OBRIGATÓRIO E COM ATÉ 20 CARACTERES!";

            if (dto.DataAdmissao == default || dto.DataAdmissao > hoje)
                return "DATA DE ADMISSÃO INVÁLIDA!";

            //ENDEREÇOS
            if (exigirEndereco && (dto.Enderecos == null || dto.Enderecos.Count == 0))
                return "INFORME PELO MENOS UM ENDEREÇO!";

            foreach (var e in dto.Enderecos ?? new List<EnderecoDTO>())
            {
                if (string.IsNullOrWhiteSpace(e.CEP) || e.CEP.Length != 8 || !e.CEP.All(char.IsDigit))
                    return "CEP INVÁLIDO! INFORME 8 DÍGITOS NUMÉRICOS.";

                if (string.IsNullOrWhiteSpace(e.Numero) || e.Numero.Length > 10)
                    return "NÚMERO DO ENDEREÇO OBRIGATÓRIO E COM ATÉ 10 CARACTERES!";

                if (e.Complemento != null && e.Complemento.Length > 150)
                    return "COMPLEMENTO COM NO MÁXIMO 150 CARACTERES!";
            }

            return null;

        }//FIM MÉTODO ValidarFuncionario
    }//FIM CLASSE
}//FIM NAMESPACE