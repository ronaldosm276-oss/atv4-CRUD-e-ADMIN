using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;
using MySqlConnector;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtendimentoController : ControllerBase
    {
        //DECLARAÇÃO DO ATRIBUTO DE CONTEXTO
        private readonly BdAulaBackendContext _context;

        //DECLARAÇÃO DO MÉTODO CONSTRUTOR
        public AtendimentoController(BdAulaBackendContext context)
        {
            _context = context;
        }

        //DECLARAÇÃO DO MÉTODO PARA LISTAR TODOS OS ATENDIMENTOS, COM PESSOA, ITENS E TOTAL
        [HttpGet]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AtendimentoRespostaDTO>>> GetAll(
    [FromQuery] int? idPessoa, [FromQuery] string? status)
        {
            //COMEÇA COM TODOS OS ATENDIMENTOS E VAI APLICANDO OS FILTROS RECEBIDOS
            var consulta = _context.Atendimentos.AsQueryable();

            if (idPessoa.HasValue)
                consulta = consulta.Where(a => a.Idpessoa == idPessoa.Value);

            if (!string.IsNullOrWhiteSpace(status))
                consulta = consulta.Where(a => a.StatusAtendimento == status);

            var atendimentos = await consulta
                .OrderBy(a => a.Idatendimento)
                .Select(a => new AtendimentoRespostaDTO
                {
                    IdAtendimento = a.Idatendimento,
                    DataAtendimento = a.DataAtendimento,
                    StatusAtendimento = a.StatusAtendimento,
                    IdPessoa = a.Idpessoa,
                    Pessoa = a.IdpessoaNavigation.Nome,

                    Itens = a.Atendimentoitems.Select(ai => new AtendimentoItemRespostaDTO
                    {
                        IdItem = ai.Iditem,
                        Item = ai.IditemNavigation.Item1,
                        IdFuncionario = ai.Idfuncionario,
                        Funcionario = ai.IdfuncionarioNavigation.IdpessoaNavigation.Nome,
                        QuantidadeItens = ai.QuantidadeItens,
                        ValorUnitario = ai.ValorunitarioEntrada,
                        Subtotal = ai.QuantidadeItens * ai.ValorunitarioEntrada
                    }).ToList(),

                    ValorTotal = a.Atendimentoitems.Sum(ai => ai.QuantidadeItens * ai.ValorunitarioEntrada)

                }).ToListAsync();

            return Ok(atendimentos);

        }//FIM MÉTODO GetAll

        //DECLARAÇÃO DO MÉTODO PARA BUSCAR UM ATENDIMENTO PELO ID, COM OS DETALHES
        [HttpGet("{id}")]
        public async Task<ActionResult<AtendimentoRespostaDTO>> GetAtendimento(int id)
        {
            var atendimento = await _context.Atendimentos
                .Where(a => a.Idatendimento == id)
                .Select(a => new AtendimentoRespostaDTO
                {
                    IdAtendimento = a.Idatendimento,
                    DataAtendimento = a.DataAtendimento,
                    StatusAtendimento = a.StatusAtendimento,
                    IdPessoa = a.Idpessoa,
                    Pessoa = a.IdpessoaNavigation.Nome,

                    Itens = a.Atendimentoitems.Select(ai => new AtendimentoItemRespostaDTO
                    {
                        IdItem = ai.Iditem,
                        Item = ai.IditemNavigation.Item1,
                        IdFuncionario = ai.Idfuncionario,
                        Funcionario = ai.IdfuncionarioNavigation.IdpessoaNavigation.Nome,
                        QuantidadeItens = ai.QuantidadeItens,
                        ValorUnitario = ai.ValorunitarioEntrada,
                        Subtotal = ai.QuantidadeItens * ai.ValorunitarioEntrada
                    }).ToList(),

                    ValorTotal = a.Atendimentoitems.Sum(ai => ai.QuantidadeItens * ai.ValorunitarioEntrada)

                }).FirstOrDefaultAsync();

            //VERIFICA SE O ATENDIMENTO EXISTE
            if (atendimento == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ATENDIMENTO NÃO LOCALIZADO!"
                    });
            }

            return Ok(atendimento);

        }//FIM MÉTODO GetAtendimento

        //MÉTODO PRIVADO QUE VERIFICA SE PESSOA, FUNCIONÁRIOS E ITENS DO DTO EXISTEM; DEVOLVE A MENSAGEM OU null
        private async Task<string?> VerificarExistenciaAsync(AtendimentoDTO dto)
        {
            bool pessoaExiste = await _context.Pessoas
                .AnyAsync(p => p.Idpessoa == dto.IdPessoa);

            if (!pessoaExiste)
                return "PESSOA NÃO LOCALIZADA!";

            //CONTA OS IDS DISTINTOS ENCONTRADOS E COMPARA COM OS ENVIADOS, EM UMA CONSULTA POR TABELA (SEM CONSULTA DENTRO DE LOOP)
            var idsFuncionarios = dto.Itens.Select(i => i.IdFuncionario).Distinct().ToList();
            int funcionarios = await _context.Funcionarios
                .CountAsync(f => idsFuncionarios.Contains(f.Idpessoa));

            if (funcionarios != idsFuncionarios.Count)
                return "FUNCIONÁRIO NÃO LOCALIZADO!";

            var idsItens = dto.Itens.Select(i => i.IdItem).Distinct().ToList();
            int itens = await _context.Items
                .CountAsync(i => idsItens.Contains(i.Iditem));

            if (itens != idsItens.Count)
                return "ITEM NÃO LOCALIZADO!";

            return null;

        }//FIM MÉTODO VerificarExistenciaAsync

        //MÉTODO PRIVADO DE VALIDAÇÃO DOS CAMPOS: DEVOLVE A MENSAGEM DE ERRO OU null SE ESTIVER TUDO CERTO
        private static string? ValidarAtendimento(AtendimentoDTO dto)
        {
            var hoje = DateOnly.FromDateTime(DateTime.Today);

            if (dto.IdPessoa <= 0)
                return "PESSOA INVÁLIDA!";

            if (dto.DataAtendimento == default || dto.DataAtendimento > hoje)
                return "DATA DO ATENDIMENTO INVÁLIDA!";

            if (string.IsNullOrWhiteSpace(dto.StatusAtendimento) || dto.StatusAtendimento.Length != 1)
                return "STATUS DEVE TER 1 CARACTERE!";

            if (dto.Itens == null || dto.Itens.Count == 0)
                return "INFORME PELO MENOS UM ITEM!";

            foreach (var i in dto.Itens)
            {
                if (i.IdItem <= 0)
                    return "ITEM INVÁLIDO!";

                if (i.IdFuncionario <= 0)
                    return "FUNCIONÁRIO INVÁLIDO!";

                if (i.QuantidadeItens <= 0)
                    return "QUANTIDADE DEVE SER MAIOR QUE ZERO!";

                if (i.ValorUnitario <= 0 || i.ValorUnitario > 99999999.99m)
                    return "VALOR UNITÁRIO DEVE ESTAR ENTRE 0,01 E 99.999.999,99!";

                if (decimal.Round(i.ValorUnitario, 2) != i.ValorUnitario)
                    return "VALOR UNITÁRIO COM NO MÁXIMO 2 CASAS DECIMAIS!";
            }

            //A PK DE atendimentoitem É (idatendimento + iditem): O MESMO ITEM NÃO PODE REPETIR NO ATENDIMENTO
            if (dto.Itens.GroupBy(i => i.IdItem).Any(g => g.Count() > 1))
                return "ITEM REPETIDO! SOME AS QUANTIDADES EM UM ÚNICO ITEM.";

            return null;

        }//FIM MÉTODO ValidarAtendimento

        //MÉTODO PRIVADO QUE TRADUZ O ERRO DO BANCO: A TRIGGER USA SQLSTATE 45000 PARA ESTOQUE INSUFICIENTE OU ITEM INDISPONÍVEL
        private ActionResult TratarErroBanco(DbUpdateException ex)
        {
            if (ex.InnerException is MySqlException mex && mex.SqlState == "45000")
            {
                return Conflict(new { mensagem = mex.Message.ToUpper() });
            }

            return BadRequest(new { mensagem = "NÃO FOI POSSÍVEL GRAVAR! VERIFIQUE OS DADOS INFORMADOS." });

        }//FIM MÉTODO TratarErroBanco

        //DECLARAÇÃO DO MÉTODO PARA CADASTRAR UM ATENDIMENTO COM SEUS ITENS
        [HttpPost]
        public async Task<ActionResult<AtendimentoDTO>> Post(AtendimentoDTO dto)
        {
            //VALIDA OS CAMPOS ANTES DE CONSULTAR O BANCO
            var erro = ValidarAtendimento(dto);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            //VERIFICA SE PESSOA, FUNCIONÁRIOS E ITENS EXISTEM
            var naoLocalizado = await VerificarExistenciaAsync(dto);
            if (naoLocalizado != null)
            {
                return NotFound(new { mensagem = naoLocalizado });
            }

            //PROJETA OS DADOS DO DTO PARA O MODELO Atendimento, JÁ COM OS ITENS DENTRO
            var atendimento = new Atendimento
            {
                Idpessoa = dto.IdPessoa,
                DataAtendimento = dto.DataAtendimento,
                StatusAtendimento = dto.StatusAtendimento,

                Atendimentoitems = dto.Itens.Select(i => new Atendimentoitem
                {
                    Iditem = i.IdItem,
                    Idfuncionario = i.IdFuncionario,
                    QuantidadeItens = i.QuantidadeItens,
                    ValorunitarioEntrada = i.ValorUnitario
                }).ToList()
            };

            //UM ÚNICO SaveChanges GRAVA CABEÇALHO E ITENS NA MESMA TRANSAÇÃO; A TRIGGER VALIDA E DEBITA O ESTOQUE
            _context.Atendimentos.Add(atendimento);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return TratarErroBanco(ex);
            }

            //DEVOLVE OS DADOS COM O ID QUE O BANCO GEROU
            dto.IdAtendimento = atendimento.Idatendimento;

            return CreatedAtAction(
                nameof(GetAtendimento),
                new { id = atendimento.Idatendimento },
                dto);

        }//FIM MÉTODO Post

        //DECLARAÇÃO DO MÉTODO PARA ATUALIZAR UM ATENDIMENTO E SEUS ITENS
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, AtendimentoDTO dto)
        {
            //REAPROVEITA AS VALIDAÇÕES USADAS NO CADASTRO
            var erro = ValidarAtendimento(dto);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            var naoLocalizado = await VerificarExistenciaAsync(dto);
            if (naoLocalizado != null)
            {
                return NotFound(new { mensagem = naoLocalizado });
            }

            //SERIALIZABLE EVITA QUE O ESTOQUE MUDE NO MEIO DA ATUALIZAÇÃO
            await using var transacao = await _context.Database
                .BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            var atendimento = await _context.Atendimentos
                .Include(a => a.Atendimentoitems)
                .FirstOrDefaultAsync(a => a.Idatendimento == id);

            if (atendimento == null)
            {
                return NotFound(new { mensagem = "ATENDIMENTO NÃO LOCALIZADO!" });
            }

            var idsItens = atendimento.Atendimentoitems.Select(i => i.Iditem)
                .Union(dto.Itens.Select(i => i.IdItem))
                .ToList();

            var tiposItens = await _context.Items
                .Where(i => idsItens.Contains(i.Iditem))
                .ToDictionaryAsync(i => i.Iditem, i => i.TipoItem);

            var estoques = await _context.Estoques
                .Where(e => idsItens.Contains(e.Iditem))
                .ToDictionaryAsync(e => e.Iditem);

            atendimento.Idpessoa = dto.IdPessoa;
            atendimento.DataAtendimento = dto.DataAtendimento;
            atendimento.StatusAtendimento = dto.StatusAtendimento;

            var itensNovos = new List<Atendimentoitem>();
            var idsRecebidos = dto.Itens.Select(i => i.IdItem).ToHashSet();

            foreach (var itemAtual in atendimento.Atendimentoitems.ToList())
            {
                if (!idsRecebidos.Contains(itemAtual.Iditem))
                {
                    if (tiposItens[itemAtual.Iditem] == "P" && estoques.TryGetValue(itemAtual.Iditem, out var estoqueRemovido))
                    {
                        estoqueRemovido.QuantidadeEstoque += itemAtual.QuantidadeItens;
                    }

                    _context.Atendimentoitems.Remove(itemAtual);
                    continue;
                }

                var itemDto = dto.Itens.First(i => i.IdItem == itemAtual.Iditem);

                if (tiposItens[itemAtual.Iditem] == "P" && itemDto.QuantidadeItens != itemAtual.QuantidadeItens)
                {
                    if (!estoques.TryGetValue(itemAtual.Iditem, out var estoque))
                    {
                        return Conflict(new { mensagem = "ESTOQUE DO PRODUTO NÃO LOCALIZADO!" });
                    }

                    var diferenca = itemDto.QuantidadeItens - itemAtual.QuantidadeItens;
                    if (diferenca > estoque.QuantidadeEstoque)
                    {
                        return Conflict(new { mensagem = "ESTOQUE INSUFICIENTE PARA ATUALIZAR O ATENDIMENTO!" });
                    }

                    estoque.QuantidadeEstoque -= diferenca;
                }

                itemAtual.Idfuncionario = itemDto.IdFuncionario;
                itemAtual.QuantidadeItens = itemDto.QuantidadeItens;
                itemAtual.ValorunitarioEntrada = itemDto.ValorUnitario;
            }

            foreach (var itemDto in dto.Itens.Where(i => !atendimento.Atendimentoitems.Any(a => a.Iditem == i.IdItem)))
            {
                itensNovos.Add(new Atendimentoitem
                {
                    Idatendimento = id,
                    Iditem = itemDto.IdItem,
                    Idfuncionario = itemDto.IdFuncionario,
                    QuantidadeItens = itemDto.QuantidadeItens,
                    ValorunitarioEntrada = itemDto.ValorUnitario
                });
            }

            try
            {
                //GRAVA ALTERAÇÕES E DEVOLVE AO ESTOQUE OS ITENS REMOVIDOS/REDUZIDOS
                await _context.SaveChangesAsync();

                //A TRIGGER DE atendimentoitem DEBITA DO ESTOQUE OS ITENS NOVOS
                _context.Atendimentoitems.AddRange(itensNovos);
                await _context.SaveChangesAsync();

                await transacao.CommitAsync();
            }
            catch (DbUpdateException ex)
            {
                return TratarErroBanco(ex);
            }

            return NoContent();

        }//FIM MÉTODO Put
         //TRANSIÇÕES PERMITIDAS: A=ABERTO, P=EM PROCESSAMENTO, C=CONCLUÍDO, X=CANCELADO
        private static readonly Dictionary<string, string[]> Transicoes = new()
        {
            ["A"] = new[] { "P", "X" },
            ["P"] = new[] { "C", "X" },
            ["C"] = Array.Empty<string>(),
            ["X"] = Array.Empty<string>()
        };

        //DECLARAÇÃO DO MÉTODO PARA ALTERAR SOMENTE O STATUS DE UM ATENDIMENTO
        [HttpPut("{id}/status")]
        public async Task<IActionResult> PutStatus(int id, StatusAtendimentoDTO dto)
        {
            var novo = dto.Status?.Trim().ToUpper();

            if (string.IsNullOrEmpty(novo) || !Transicoes.ContainsKey(novo))
                return BadRequest(new { mensagem = "STATUS INVÁLIDO! USE A, P, C OU X." });

            await using var transacao = await _context.Database
                .BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            var atendimento = await _context.Atendimentos
                .Include(a => a.Atendimentoitems)
                .FirstOrDefaultAsync(a => a.Idatendimento == id);

            if (atendimento == null)
                return NotFound(new { mensagem = "ATENDIMENTO NÃO LOCALIZADO!" });

            var atual = atendimento.StatusAtendimento ?? "";

            if (!Transicoes.TryGetValue(atual, out var permitidos) || !permitidos.Contains(novo))
                return Conflict(new { mensagem = $"TRANSIÇÃO DE {atual} PARA {novo} NÃO PERMITIDA!" });

            //AO CANCELAR, DEVOLVE AO ESTOQUE OS PRODUTOS (SERVIÇO NÃO TEM LINHA EM ESTOQUE)
            if (novo == "X")
            {
                var idsItens = atendimento.Atendimentoitems.Select(i => i.Iditem).ToList();

                var estoques = await _context.Estoques
                    .Where(e => idsItens.Contains(e.Iditem))
                    .ToDictionaryAsync(e => e.Iditem);

                foreach (var item in atendimento.Atendimentoitems)
                {
                    if (estoques.TryGetValue(item.Iditem, out var estoque))
                        estoque.QuantidadeEstoque += item.QuantidadeItens;
                }
            }

            atendimento.StatusAtendimento = novo;

            await _context.SaveChangesAsync();
            await transacao.CommitAsync();

            return NoContent();
        }//FIM MÉTODO PutStatus
        //DECLARAÇÃO DO MÉTODO PARA EXCLUIR UM ATENDIMENTO E SEUS ITENS
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            //A TRANSAÇÃO COMEÇA ANTES DAS LEITURAS, COM AS LINHAS TRAVADAS (Serializable)
            await using var transacao = await _context.Database
                .BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            //BUSCA O ATENDIMENTO COM OS ITENS
            var atendimento = await _context.Atendimentos
                .Include(a => a.Atendimentoitems)
                .FirstOrDefaultAsync(a => a.Idatendimento == id);

            //VERIFICA SE O ATENDIMENTO EXISTE
            if (atendimento == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ATENDIMENTO NÃO LOCALIZADO!"
                    });
            }

            //CARREGA OS ESTOQUES DOS ITENS EM UMA CONSULTA; SERVIÇO NÃO TEM LINHA EM ESTOQUE
            var idsItens = atendimento.Atendimentoitems.Select(ai => ai.Iditem).ToList();

            var estoques = await _context.Estoques
                .Where(e => idsItens.Contains(e.Iditem))
                .ToDictionaryAsync(e => e.Iditem);

            //DEVOLVE AO ESTOQUE A QUANTIDADE DE CADA PRODUTO QUE A TRIGGER DEBITOU NO ATENDIMENTO
            foreach (var item in atendimento.Atendimentoitems)
            {
                if (estoques.TryGetValue(item.Iditem, out var estoque))
                {
                    estoque.QuantidadeEstoque += item.QuantidadeItens;
                }
            }

            //REMOVE NA ORDEM DOS FILHOS PARA O PAI: ITENS E DEPOIS ATENDIMENTO
            _context.Atendimentoitems.RemoveRange(atendimento.Atendimentoitems);
            _context.Atendimentos.Remove(atendimento);

            //GRAVA TUDO E CONFIRMA A TRANSAÇÃO; SE ALGO FALHAR, O Dispose DA TRANSAÇÃO DESFAZ TUDO
            try
            {
                await _context.SaveChangesAsync();
                await transacao.CommitAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new { mensagem = "NÃO FOI POSSÍVEL EXCLUIR! EXISTEM REGISTROS VINCULADOS AO ATENDIMENTO." });
            }

            return NoContent();

            //}//FIM MÉTODO Delete

        }//FIM CLASSE
    }//FIM NAMESPACE
}
