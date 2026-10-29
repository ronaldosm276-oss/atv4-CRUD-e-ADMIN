using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntradaProdutoController : ControllerBase
    {
        //DECLARAÇÃO DO ATRIBUTO DE CONTEXTO
        private readonly BdAulaBackendContext _context;

        //DECLARAÇÃO DO MÉTODO CONSTRUTOR
        public EntradaProdutoController(BdAulaBackendContext context)
        {
            _context = context;
        }

        //DECLARAÇÃO DO MÉTODO PARA LISTAR TODAS AS ENTRADAS
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EntradaProdutoRespostaDTO>>> GetAll()
        {
            var entradas = await _context.EntradaProdutos
                .OrderBy(e => e.IdentradaProduto)
                .Select(e => new EntradaProdutoRespostaDTO
                {
                    IdEntradaProduto = e.IdentradaProduto,
                    IdItem = e.Iditem,
                    DataEntradaProduto = e.DataEntradaProduto,
                    QuantidadeEntrada = e.QuantidadeEntrada,
                    Unidade = e.Unidade,
                    ValorUnitarioEntrada = e.ValorUnitarioEntrada,

                    Item = e.IditemNavigation.IditemNavigation.IditemNavigation.Item1,
                    QuantidadeEstoqueAtual = e.IditemNavigation.QuantidadeEstoque,
                    PrecoVenda = e.IditemNavigation.IditemNavigation.PrecoVenda
                }).ToListAsync();

            return Ok(entradas);

        }//FIM MÉTODO GetAll

        //DECLARAÇÃO DO MÉTODO PARA BUSCAR UMA ENTRADA PELO ID
        [HttpGet("{id}")]
        public async Task<ActionResult<EntradaProdutoRespostaDTO>> GetEntrada(int id)
        {
            var entrada = await _context.EntradaProdutos
                .Where(e => e.IdentradaProduto == id)
                .Select(e => new EntradaProdutoRespostaDTO
                {
                    IdEntradaProduto = e.IdentradaProduto,
                    IdItem = e.Iditem,
                    DataEntradaProduto = e.DataEntradaProduto,
                    QuantidadeEntrada = e.QuantidadeEntrada,
                    Unidade = e.Unidade,
                    ValorUnitarioEntrada = e.ValorUnitarioEntrada,

                    Item = e.IditemNavigation.IditemNavigation.IditemNavigation.Item1,
                    QuantidadeEstoqueAtual = e.IditemNavigation.QuantidadeEstoque,
                    PrecoVenda = e.IditemNavigation.IditemNavigation.PrecoVenda
                }).FirstOrDefaultAsync();

            //VERIFICA SE A ENTRADA EXISTE
            if (entrada == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ENTRADA DE PRODUTO NÃO LOCALIZADA!"
                    });
            }

            return Ok(entrada);

        }//FIM MÉTODO GetEntrada
         //DECLARAÇÃO DO MÉTODO PARA REGISTRAR UMA ENTRADA DE PRODUTO
        [HttpPost]
        public async Task<ActionResult<EntradaProdutoDTO>> Post(EntradaProdutoDTO dto)
        {
            //VALIDA OS DADOS ANTES DE CONSULTAR O BANCO
            var erro = ValidarEntrada(dto);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }
            //A FK DA ENTRADA APONTA PARA ESTOQUE, ENTÃO SÓ PRODUTO COM ESTOQUE PODE RECEBER ENTRADA (SERVIÇO NÃO)
            bool produtoExiste = await _context.Estoques
                .AnyAsync(e => e.Iditem == dto.IdItem);

            if (!produtoExiste)
            {
                return NotFound(
                    new
                    {
                        mensagem = "PRODUTO NÃO LOCALIZADO!"
                    });
            }

            //PROJETA OS DADOS DO DTO PARA O MODELO EntradaProduto
            var entrada = new EntradaProduto
            {
                Iditem = dto.IdItem,
                DataEntradaProduto = dto.DataEntradaProduto,
                QuantidadeEntrada = dto.QuantidadeEntrada,
                Unidade = dto.Unidade,
                ValorUnitarioEntrada = dto.ValorUnitarioEntrada
            };

            //O INSERT DISPARA A TRIGGER tr_entrada_produto, QUE ATUALIZA ESTOQUE, PREÇO E PREÇO DE VENDA NA MESMA TRANSAÇÃO
            _context.EntradaProdutos.Add(entrada);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { mensagem = "NÃO FOI POSSÍVEL GRAVAR! VERIFIQUE OS DADOS INFORMADOS." });
            }

            //DEVOLVE OS DADOS COM O ID QUE O BANCO GEROU
            dto.IdEntradaProduto = entrada.IdentradaProduto;

            return CreatedAtAction(
                nameof(GetEntrada),
                new { id = entrada.IdentradaProduto },
                dto);

        }//FIM MÉTODO Post

         //DECLARAÇÃO DO MÉTODO PARA ATUALIZAR UMA ENTRADA DE PRODUTO
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, EntradaProdutoDTO dto)
        {
            //VALIDA OS DADOS ANTES DE ABRIR A TRANSAÇÃO
            var erro = ValidarEntrada(dto);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            //A TRANSAÇÃO COMEÇA ANTES DAS LEITURAS: NO NÍVEL Serializable O MYSQL TRAVA AS LINHAS LIDAS, EVITANDO DOIS PUTs SOBRESCREVEREM O MESMO ESTOQUE
            await using var transacao = await _context.Database
                .BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            //BUSCA A ENTRADA JÁ COM O ESTOQUE
            var entrada = await _context.EntradaProdutos
                .Include(e => e.IditemNavigation)
                .FirstOrDefaultAsync(e => e.IdentradaProduto == id);

            //VERIFICA SE A ENTRADA EXISTE
            if (entrada == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ENTRADA DE PRODUTO NÃO LOCALIZADA!"
                    });
            }

            //O PRODUTO FAZ PARTE DA CHAVE DA ENTRADA E O ESTOQUE JÁ FOI AFETADO POR ELE: NÃO PODE TROCAR
            if (dto.IdItem != entrada.Iditem)
            {
                return BadRequest(
                    new
                    {
                        mensagem = "NÃO É POSSÍVEL ALTERAR O PRODUTO DA ENTRADA! EXCLUA E CADASTRE NOVAMENTE."
                    });
            }

            //CALCULA A DIFERENÇA ENTRE A QUANTIDADE NOVA E A ANTIGA E VERIFICA SE O ESTOQUE FICA NEGATIVO
            var estoque = entrada.IditemNavigation;
            int diferenca = dto.QuantidadeEntrada - entrada.QuantidadeEntrada;

            if (estoque.QuantidadeEstoque + diferenca < 0)
            {
                return Conflict(
                    new
                    {
                        mensagem = "NÃO É POSSÍVEL REDUZIR! PARTE DESTA ENTRADA JÁ FOI CONSUMIDA E O ESTOQUE FICARIA NEGATIVO."
                    });
            }

            //APLICA A DIFERENÇA NO ESTOQUE E COPIA OS DADOS DA ENTRADA
            estoque.QuantidadeEstoque += diferenca;

            entrada.DataEntradaProduto = dto.DataEntradaProduto;
            entrada.QuantidadeEntrada = dto.QuantidadeEntrada;
            entrada.Unidade = dto.Unidade;
            entrada.ValorUnitarioEntrada = dto.ValorUnitarioEntrada;

            //A TRIGGER USA A ÚLTIMA ENTRADA COMO CUSTO ATUAL: SE ESTA É A ÚLTIMA, RECALCULA PREÇO E PREÇO DE VENDA
            bool ehUltima = !await _context.EntradaProdutos
                .AnyAsync(e => e.Iditem == entrada.Iditem && e.IdentradaProduto > id);

            if (ehUltima)
            {
                var produto = await _context.Produtos
                    .Include(p => p.IditemNavigation)
                    .FirstAsync(p => p.Iditem == entrada.Iditem);

                produto.IditemNavigation.Preco = dto.ValorUnitarioEntrada;
                produto.PrecoVenda = CalcPrecoVenda(produto.CodigoPreco, dto.ValorUnitarioEntrada);
            }

            //GRAVA TUDO E CONFIRMA A TRANSAÇÃO; SE ALGO FALHAR, O Dispose DA TRANSAÇÃO DESFAZ TUDO
            try
            {
                await _context.SaveChangesAsync();
                await transacao.CommitAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new { mensagem = "NÃO FOI POSSÍVEL ATUALIZAR! VERIFIQUE OS DADOS INFORMADOS." });
            }

            return NoContent();

        }//FIM MÉTODO Put

        //MÉTODO PRIVADO QUE REPRODUZ A REGRA DA FUNÇÃO fn_calc_preco_venda DO BANCO
        private static decimal CalcPrecoVenda(int codigoPreco, decimal precoCusto)
        {
            decimal percentual = codigoPreco switch
            {
                1 => 0.04m,
                2 => 0.08m,
                3 => 0.10m,
                _ => 0m
            };

            return Math.Round(precoCusto + (precoCusto * percentual), 2, MidpointRounding.AwayFromZero);
        }

        //DECLARAÇÃO DO MÉTODO PARA EXCLUIR UMA ENTRADA DE PRODUTO
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            //A TRANSAÇÃO COMEÇA ANTES DAS LEITURAS, COM AS LINHAS TRAVADAS (Serializable)
            await using var transacao = await _context.Database
                .BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            //BUSCA A ENTRADA JÁ COM O ESTOQUE
            var entrada = await _context.EntradaProdutos
                .Include(e => e.IditemNavigation)
                .FirstOrDefaultAsync(e => e.IdentradaProduto == id);

            //VERIFICA SE A ENTRADA EXISTE
            if (entrada == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ENTRADA DE PRODUTO NÃO LOCALIZADA!"
                    });
            }

            //ESTORNA A QUANTIDADE DA ENTRADA; SE O ESTOQUE FICAR NEGATIVO, PARTE DELA JÁ FOI CONSUMIDA
            var estoque = entrada.IditemNavigation;

            if (estoque.QuantidadeEstoque - entrada.QuantidadeEntrada < 0)
            {
                return Conflict(
                    new
                    {
                        mensagem = "NÃO É POSSÍVEL EXCLUIR! PARTE DESTA ENTRADA JÁ FOI CONSUMIDA E O ESTOQUE FICARIA NEGATIVO."
                    });
            }

            estoque.QuantidadeEstoque -= entrada.QuantidadeEntrada;

            //SE ESTA ERA A ÚLTIMA ENTRADA, O CUSTO VIGENTE VOLTA PARA O DA ENTRADA ANTERIOR
            bool ehUltima = !await _context.EntradaProdutos
                .AnyAsync(e => e.Iditem == entrada.Iditem && e.IdentradaProduto > id);

            if (ehUltima)
            {
                var anterior = await _context.EntradaProdutos
                    .Where(e => e.Iditem == entrada.Iditem && e.IdentradaProduto < id)
                    .OrderByDescending(e => e.IdentradaProduto)
                    .FirstOrDefaultAsync();

                //SE NÃO HÁ ENTRADA ANTERIOR, O PREÇO ATUAL É MANTIDO
                if (anterior != null)
                {
                    var produto = await _context.Produtos
                        .Include(p => p.IditemNavigation)
                        .FirstAsync(p => p.Iditem == entrada.Iditem);

                    produto.IditemNavigation.Preco = anterior.ValorUnitarioEntrada;
                    produto.PrecoVenda = CalcPrecoVenda(produto.CodigoPreco, anterior.ValorUnitarioEntrada);
                }
            }

            //REMOVE A ENTRADA, GRAVA TUDO E CONFIRMA A TRANSAÇÃO
            _context.EntradaProdutos.Remove(entrada);
            try
            {
                await _context.SaveChangesAsync();
                await transacao.CommitAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new { mensagem = "NÃO FOI POSSÍVEL EXCLUIR! EXISTEM REGISTROS VINCULADOS." });
            }

            return NoContent();

        }//FIM MÉTODO Delete

        //MÉTODO PRIVADO DE VALIDAÇÃO: DEVOLVE A MENSAGEM DE ERRO OU null SE ESTIVER TUDO CERTO
        private static string? ValidarEntrada(EntradaProdutoDTO dto)
        {
            var hoje = DateOnly.FromDateTime(DateTime.Today);

            if (dto.IdItem <= 0)
                return "PRODUTO INVÁLIDO!";

            if (dto.DataEntradaProduto == default || dto.DataEntradaProduto > hoje)
                return "DATA DE ENTRADA INVÁLIDA!";

            if (dto.QuantidadeEntrada <= 0)
                return "QUANTIDADE DEVE SER MAIOR QUE ZERO!";

            if (string.IsNullOrWhiteSpace(dto.Unidade) || dto.Unidade.Length > 10)
                return "UNIDADE OBRIGATÓRIA E COM ATÉ 10 CARACTERES!";

            if (dto.ValorUnitarioEntrada <= 0 || dto.ValorUnitarioEntrada > 99999999.99m)
                return "VALOR UNITÁRIO DEVE ESTAR ENTRE 0,01 E 99.999.999,99!";

            if (decimal.Round(dto.ValorUnitarioEntrada, 2) != dto.ValorUnitarioEntrada)
                return "VALOR UNITÁRIO COM NO MÁXIMO 2 CASAS DECIMAIS!";

            return null;

        }//FIM MÉTODO ValidarEntrada


    }//FIM CLASSE
}//FIM NAMESPACE