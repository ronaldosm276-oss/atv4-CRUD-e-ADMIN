using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PessoaEnderecoController : ControllerBase
    // isso serviu para
    {
        //declaração do atributo de contexto
        private readonly BdAulaBackendContext _context;
        //declaração do método construtor
        public PessoaEnderecoController(BdAulaBackendContext context)
        {
            _context = context;
        }

        //DECLARAÇÃO DO MÉTODO PARA LISTAR TODAS AS PESSOAS E SEUS ENDEREÇOS
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PessoaDTO>>> GetAll()
        {
            var pessoas = await _context.Pessoas
                .Select(p => new PessoaDTO
                {
                    IdPessoa = p.Idpessoa,
                    Nome = p.Nome,
                    CPF = (long)p.Cpf,
                    DataNascimento = p.DataNascimento,
                    sexo = p.Sexo,
                    email = p.Email,
                    telefone = (long)p.Telefone,
                    AtivoPessoa = p.AtivoPessoa,

                    Enderecos = p.Enderecos.Select(e => new EnderecoDTO
                    {
                        IdEndereco = e.Idendereco,
                        IdPessoa = e.Idpessoa,
                        CEP = e.Cep,
                        Numero = e.Numero,
                        Complemento = e.Complemento,

                    }).ToList()

                }).ToListAsync();

            return Ok(pessoas);

        }//FIM MÉTODO GetAll

        //DECLARAÇÃO DO MÉTODO PARA LISTAR APENAS UMA PESSOA E SEUS ENDEREÇOS
        [HttpGet("{id}")]
        public async Task<ActionResult<PessoaDTO>> GetPessoa(int id)
        {
            var pessoa = await _context.Pessoas
                .Where(p => p.Idpessoa == id)
                .Select(p => new PessoaDTO
                {
                    IdPessoa = p.Idpessoa,
                    Nome = p.Nome,
                    CPF = (long)p.Cpf,
                    DataNascimento = p.DataNascimento,
                    sexo = p.Sexo,
                    email = p.Email,
                    telefone = (long)p.Telefone,
                    AtivoPessoa = p.AtivoPessoa,

                    Enderecos = p.Enderecos.Select(e => new EnderecoDTO
                    {
                        IdEndereco = e.Idendereco,
                        IdPessoa = e.Idpessoa,
                        CEP = e.Cep,
                        Numero = e.Numero,
                        Complemento = e.Complemento,

                    }).ToList()

                }).FirstOrDefaultAsync();

            if (pessoa == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "PESSOA NÃO LOCALIZADA!"
                    });
            }

            return Ok(pessoa);

        }//FIM MÉTODO GetPessoa

        //DECLARAÇÃO DO MÉTODO PARA CADASTRAR UMA PESSOA E SEUS ENDEREÇOS
        [HttpPost]
        public async Task<ActionResult<PessoaDTO>> Post(PessoaDTO dto)
        {
            //VALIDA OS DADOS ANTES DE GRAVAR
            var erro = ValidarPessoa(dto);
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

            //PROJETA OS DADOS DO PessoaDTO PARA O MODELO Pessoa (COM A LISTA DE ENDEREÇOS)
            var pessoa = new Pessoa
            {
                Nome = dto.Nome!,
                Cpf = (ulong)dto.CPF,
                DataNascimento = dto.DataNascimento,
                Sexo = dto.sexo,
                Email = dto.email,
                Telefone = (ulong)dto.telefone,
                AtivoPessoa = dto.AtivoPessoa,

                Enderecos = (dto.Enderecos ?? new List<EnderecoDTO>()).Select(e => new Endereco
                {
                    Cep = e.CEP,
                    Numero = e.Numero,
                    Complemento = e.Complemento ?? string.Empty
                }).ToList()
            };

            //UM ÚNICO SaveChanges GRAVA A PESSOA E OS ENDEREÇOS NA MESMA TRANSAÇÃO
            try
            {
                _context.Pessoas.Add(pessoa);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    mensagem = "ERRO AO CADASTRAR A PESSOA!",
                    detalhe = ex.InnerException?.Message ?? ex.Message
                });
            }

            var resposta = new PessoaDTO
            {
                IdPessoa = pessoa.Idpessoa,
                Nome = pessoa.Nome,
                CPF = (long)pessoa.Cpf,
                DataNascimento = pessoa.DataNascimento,
                sexo = pessoa.Sexo,
                email = pessoa.Email,
                telefone = (long)pessoa.Telefone,
                AtivoPessoa = pessoa.AtivoPessoa,

                Enderecos = pessoa.Enderecos.Select(e => new EnderecoDTO
                {
                    IdEndereco = e.Idendereco,
                    IdPessoa = e.Idpessoa,
                    CEP = e.Cep,
                    Numero = e.Numero,
                    Complemento = e.Complemento
                }).ToList()
            };

            return CreatedAtAction(
                nameof(GetPessoa),
                new { id = pessoa.Idpessoa },
                resposta);

        }//FIM MÉTODO Post

        //DECLARAÇÃO DO MÉTODO PARA ALTERAR UMA PESSOA E SEUS ENDEREÇOS
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, PessoaDTO dto)
        {
            //VALIDA OS DADOS ANTES DE GRAVAR
            var erro = ValidarPessoa(dto);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            //BUSCA A PESSOA E SEUS ENDEREÇOS E ATRIBUI À VARIÁVEL pessoa
            var pessoa = await _context.Pessoas
                .Include(p => p.Enderecos)
                .FirstOrDefaultAsync(p => p.Idpessoa == id);

            //VERIFICA SE A PESSOA EXISTE
            if (pessoa == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "PESSOA NÃO LOCALIZADA!"
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

            //PROJETA OS DADOS DO PessoaDTO PARA O MODELO Pessoa ORIUNDA DO BANCO DE DADOS
            pessoa.Nome = dto.Nome!;
            pessoa.Cpf = (ulong)dto.CPF;
            pessoa.DataNascimento = dto.DataNascimento;
            pessoa.Sexo = dto.sexo;
            pessoa.Email = dto.email;
            pessoa.Telefone = (ulong)dto.telefone;
            pessoa.AtivoPessoa = dto.AtivoPessoa;

            //PERCORRE OS ENDEREÇOS ENVIADOS
            foreach (var endPessoa in dto.Enderecos ?? new List<EnderecoDTO>())
            {
                //SE VEIO IdEndereco, O ENDEREÇO JÁ EXISTE E SERÁ ATUALIZADO
                if (endPessoa.IdEndereco > 0)
                {
                    //BUSCA O ENDEREÇO ENTRE OS ENDEREÇOS DA PRÓPRIA PESSOA
                    var endereco = pessoa.Enderecos
                        .FirstOrDefault(e => e.Idendereco == endPessoa.IdEndereco);

                    if (endereco == null)
                    {
                        return BadRequest(
                            new
                            {
                                mensagem = "O ENDEREÇO " + endPessoa.IdEndereco + " NÃO PERTENCE A ESTA PESSOA!"
                            });
                    }

                    endereco.Cep = endPessoa.CEP;
                    endereco.Numero = endPessoa.Numero;
                    endereco.Complemento = endPessoa.Complemento ?? string.Empty;
                }
                //SE NÃO VEIO IdEndereco, É UM ENDEREÇO NOVO
                else
                {
                    pessoa.Enderecos.Add(new Endereco
                    {
                        Cep = endPessoa.CEP,
                        Numero = endPessoa.Numero,
                        Complemento = endPessoa.Complemento ?? string.Empty
                    });
                }
            }

            //UM ÚNICO SaveChanges GRAVA TUDO NA MESMA TRANSAÇÃO
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    mensagem = "ERRO AO ALTERAR A PESSOA!",
                    detalhe = ex.InnerException?.Message ?? ex.Message
                });
            }

            return NoContent();

        }//FIM MÉTODO Put

        //DECLARAÇÃO DO MÉTODO PARA EXCLUIR UMA PESSOA E SEUS ENDEREÇOS
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var pessoa = await _context.Pessoas
                .Include(p => p.Enderecos)
                .FirstOrDefaultAsync(p => p.Idpessoa == id);

            if (pessoa == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "PESSOA NÃO LOCALIZADA!"
                    });
            }

            //NÃO EXCLUI SE A PESSOA TAMBÉM É FUNCIONÁRIO (CHAVE ESTRANGEIRA)
            if (await _context.Funcionarios.AnyAsync(f => f.Idpessoa == id))
            {
                return Conflict(
                    new
                    {
                        mensagem = "NÃO É POSSÍVEL EXCLUIR: A PESSOA É FUNCIONÁRIO!"
                    });
            }

            //NÃO EXCLUI SE A PESSOA JÁ TEM ATENDIMENTOS (CHAVE ESTRANGEIRA)
            if (await _context.Atendimentos.AnyAsync(a => a.Idpessoa == id))
            {
                return Conflict(
                    new
                    {
                        mensagem = "NÃO É POSSÍVEL EXCLUIR: A PESSOA POSSUI ATENDIMENTOS!"
                    });
            }

            //EXCLUI PRIMEIRO OS ENDEREÇOS (FILHOS) E DEPOIS A PESSOA (PAI), NA MESMA TRANSAÇÃO
            try
            {
                _context.Enderecos.RemoveRange(pessoa.Enderecos);
                _context.Pessoas.Remove(pessoa);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    mensagem = "ERRO AO EXCLUIR A PESSOA!",
                    detalhe = ex.InnerException?.Message ?? ex.Message
                });
            }

            return NoContent();

        }//FIM MÉTODO Delete

        //MÉTODO AUXILIAR: VALIDA OS DADOS DA PESSOA E DOS ENDEREÇOS (DEVOLVE null SE ESTIVER TUDO CERTO)
        private static string? ValidarPessoa(PessoaDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome) || dto.Nome.Length > 100)
                return "NOME OBRIGATÓRIO, COM ATÉ 100 CARACTERES!";

            if (dto.CPF <= 0 || dto.CPF > 99999999999)
                return "CPF INVÁLIDO! INFORME ATÉ 11 NÚMEROS.";

            if (dto.DataNascimento < new DateOnly(1900, 1, 1) ||
                dto.DataNascimento > DateOnly.FromDateTime(DateTime.Today))
                return "DATA DE NASCIMENTO INVÁLIDA!";

            if (dto.sexo != "M" && dto.sexo != "F")
                return "SEXO DEVE SER M OU F!";

            if (string.IsNullOrWhiteSpace(dto.email) || dto.email.Length > 100)
                return "EMAIL OBRIGATÓRIO, COM ATÉ 100 CARACTERES!";

            if (dto.telefone <= 0 || dto.telefone > 99999999999)
                return "TELEFONE INVÁLIDO! INFORME ATÉ 11 NÚMEROS.";

            if (dto.AtivoPessoa != "S" && dto.AtivoPessoa != "N")
                return "ATIVOPESSOA DEVE SER S OU N!";

            foreach (var e in dto.Enderecos ?? new List<EnderecoDTO>())
            {
                if (string.IsNullOrWhiteSpace(e.CEP) || e.CEP.Length != 8 || !e.CEP.All(char.IsDigit))
                    return "CEP DEVE TER EXATAMENTE 8 NÚMEROS!";

                if (string.IsNullOrWhiteSpace(e.Numero) || e.Numero.Length > 10)
                    return "NÚMERO DO ENDEREÇO OBRIGATÓRIO, COM ATÉ 10 CARACTERES!";

                if (e.Complemento != null && e.Complemento.Length > 150)
                    return "COMPLEMENTO COM ATÉ 150 CARACTERES!";
            }

            return null;

        }//FIM MÉTODO ValidarPessoa

    }//FIM CLASSE
}//FIM NAMESPACE

/*
 * 
 * Depois analise a diferença entre a minha AI slop 
 * e o código do professor...
 
 using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    //ANOTAÇÕES DE IDENTIFICAÇÃO DE CONTROLLER
    [ApiController]
    [Route("api/[controller]")]
    public class PessoaEnderecoController : ControllerBase
    {
        //DECLARAÇÃO DO ATRIBUTO DE CONTEXTO
        private readonly BdAulaBackendContext _context;

        //DECLARAÇÃO DO MÉTODO CONSTRUTOR
        public PessoaEnderecoController(BdAulaBackendContext context)
        {
            //INSTANCIA DO ATRIBUTO CONSTRUTOR
            _context = context;
        }

        //DECLARAÇÃO DO MÉTODO PARA LISTAR TODAS AS PESSOAS E SEUS ENDEREÇOS
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PessoaDTO>>> GetAll()
        {
            var pessoas = await _context.Pessoas
                .Select(p => new PessoaDTO
                {
                    IdPessoa = p.Idpessoa,
                    Nome = p.Nome,
                    CPF = (long)p.Cpf,
                    DataNascimento = p.DataNascimento,
                    sexo = p.Sexo,
                    email = p.Email,
                    telefone = (long)p.Telefone,
                    AtivoPessoa = p.AtivoPessoa,

                    Enderecos = p.Enderecos.Select(e => new EnderecoDTO
                    {
                       IdPessoa = e.Idpessoa,
                       CEP = e.Cep,
                       Numero = e.Numero,
                       Complemento = e.Complemento,

                    }).ToList()

                }).ToListAsync();

            return Ok(pessoas);

        }//FIM MÉTODO GetAll

        //DECLARAÇÃO DO MÉTODO PARA LISTAR UMA A PESSOA E SEUS ENDEREÇOS
        [HttpGet("{id}")]
        public async Task<ActionResult<PessoaDTO>> GetPessoa(int id)
        {
            var pessoa = await _context.Pessoas
                .Where(p => p.Idpessoa == id)
               .Select(p => new PessoaDTO
               {
                   IdPessoa = p.Idpessoa,
                   Nome = p.Nome,
                   CPF = (long)p.Cpf,
                   DataNascimento = p.DataNascimento,
                   sexo = p.Sexo,
                   email = p.Email,
                   telefone = (long)p.Telefone,
                   AtivoPessoa = p.AtivoPessoa,

                   Enderecos = p.Enderecos.Select(e => new EnderecoDTO
                   {
                       IdPessoa = e.Idpessoa,
                       CEP = e.Cep,
                       Numero = e.Numero,
                       Complemento = e.Complemento,

                   }).ToList()

               }).ToListAsync();

            return Ok(pessoa);

        }//FIM MÉTODO GetPEssoa

        //MÉTODO PARA CADASTRAR UMA PESSOA
        [HttpPost]
        public async Task<ActionResult<PessoaDTO>> Post(PessoaDTO dto)
        {
            var pessoa = new Pessoa
            {
                Nome = dto.Nome,
                Cpf = dto.CPF,
                DataNascimento = dto.DataNascimento,
                Sexo = dto.sexo,
                Email = dto.email,
                Telefone = dto.telefone,
                AtivoPessoa = dto.AtivoPessoa,

                Enderecos = dto.Enderecos.Select(e => new Endereco
                {
                    Cep = e.CEP,
                    Numero = e.Numero,
                    Complemento = e.Complemento
                }).ToList()
            };

            _context.Pessoas.Add(pessoa);   

            await _context.SaveChangesAsync();

            var resposta = new PessoaDTO
            {
                IdPessoa = pessoa.Idpessoa,
                Nome = pessoa.Nome,
                CPF = pessoa.Cpf,
                DataNascimento = pessoa.DataNascimento,
                sexo = pessoa.Sexo,
                email = pessoa.Email,
                telefone = pessoa.Telefone,
                AtivoPessoa = pessoa.AtivoPessoa,

                Enderecos = pessoa.Enderecos.Select(e => new EnderecoDTO
                {
                    CEP = e.Cep,
                    Numero = e.Numero,
                    Complemento = e.Complemento
                }).ToList()

            };

            return CreatedAtAction(
                nameof(GetPessoa),
                new {id = pessoa.Idpessoa},
                resposta);

        }//FIM MÉTODO Post


        //MÉTODO PARA ALTERAR UMA PESSOA
        [HttpPut("{id}")]
        public async Task<ActionResult<ActionResult<Pessoa>>> Put(int id, PessoaDTO dto)
        {
            //BUSCA A PESSOA E SEUS ENDEREÇOS E ATRIBUI A VARIÁVEL PESSOA
            var pessoa = await _context.Pessoas
                .Include(p => p.Enderecos)
                .FirstOrDefaultAsync(p => p.Idpessoa == id);

            //VERIFICA SE A PESSOA EXISTE
            if (pessoa == null)
            {
                return NotFound();
            }

            //PROJETA OS DADOS DO PessoaDTO PARA O MODELO Pessoa ORIUNDA DO BANCO DE DADOS
            pessoa.Nome = dto.Nome;
            pessoa.Cpf = dto.CPF;
            pessoa.DataNascimento = dto.DataNascimento;
            pessoa.Sexo = dto.sexo;
            pessoa.Email = dto.email;
            pessoa.Telefone = dto.telefone;
            pessoa.AtivoPessoa = dto.AtivoPessoa;

            //PERCORRE OS ENDEREÇOS DA PESSOA
            foreach (var endPessoa in dto.Enderecos)
            {
                //VERIFICA SE O ID VIM JA EXISTE COM A PESSOA
                if (endPessoa.IdPessoa > 0)
                {
                    //BUSCA O ENDERECO DA PESSOA, NO ATRIBUTO DO MODELO Pessoa.
                    var endereco = pessoa.Enderecos
                        .FirstOrDefault(e => e.Idpessoa == endPessoa.IdPessoa);

                    //CASO NÃO ENCONTRE EMITE UMA MENSAGEM DE QUE O ENDEREÇO NÃO PERTECE A ESSA PESSOA.
                    if (endereco != null)
                    {
                        return BadRequest($"O endereço não pertece a essa pessoa");
                    }

                    //AO LOCALIZAR PROJETA NO MODELO Endereco OS DADOS VINDO DO ATRIBUTO Endereços
                    //DO MODELO O PESSOA QUE VENHO DO PessoaDto
                    endereco.Numero = endPessoa.Numero;
                    endereco.Cep = endPessoa.CEP;
                    endereco.Complemento = endPessoa.Complemento;
                }
                else
                {
                    //CASO O ID NÃO SEJA MAIOR QUE 0(ZERO) É UM NOVO ENDEREÇO A SER ADICIONADO A PESSOA
                    pessoa.Enderecos.Add(new Endereco
                    {
                        Numero = endPessoa.Numero,
                        Cep = endPessoa.CEP,
                        Complemento = endPessoa.Complemento

                    });
                }
            }

            //SALVA NO BANCO DE DAOS
            await _context.SaveChangesAsync();

            return NoContent();
        }

        //MÉTODO PARA EXCLUIR UMA PESSOA
        [HttpDelete("{id}")]
        public async Task<ActionResult<Pessoa>> Delete(int id)
        {
            //BUSCA A PESSOA E SEUS ENDEREÇOS E ATRIBUI A VARIÁVEL PESSOA
            var pessoa = await _context.Pessoas
                .Include(p => p.Enderecos)
                .FirstOrDefaultAsync(p => p.Idpessoa == id);

            //VERIFICA SE A PESSOA EXISTE
            if (pessoa == null)
            {
                return NotFound();
            }

            //PREPARA A INSTRUÇÃO PARA EXECUTAR NO BANCO DE DADOS
            _context.Pessoas.Remove(pessoa);

            //SALVA NO BANCO DE DAOS
            await _context.SaveChangesAsync();

            return NoContent();
        }


    }//FIM DA CLASSE CONTROLLER PessoaEnderecoContoller
}//FIM DO NAMESPACE

 
 */