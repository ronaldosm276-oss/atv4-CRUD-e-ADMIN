using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EstoqueController : ControllerBase
    {
        private readonly BdAulaBackendContext _context;

        public EstoqueController(BdAulaBackendContext context)
        {
            _context = context;
        }

        //MONTA A CONSULTA UMA ÚNICA VEZ, USADA PELA LISTA E PELA BUSCA POR ID
        private IQueryable<EstoqueRespostaDTO> Consulta() =>
            _context.Estoques.Select(e => new EstoqueRespostaDTO
            {
                IdItem = e.Iditem,
                Item = e.IditemNavigation.IditemNavigation.Item1,
                DescricaoItem = e.IditemNavigation.IditemNavigation.DescricaoItem,
                Preco = e.IditemNavigation.IditemNavigation.Preco,
                PrecoVenda = e.IditemNavigation.PrecoVenda,
                Unidade = e.IditemNavigation.Unidade,
                Categoria = e.IditemNavigation.IditemNavigation.IdcategoriaNavigation.Categoria,
                QuantidadeEstoque = e.QuantidadeEstoque,
                AtivoProdutoServico = e.IditemNavigation.IditemNavigation.AtivoProdutoServico
            });

        //LISTAR TODO O ESTOQUE
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EstoqueRespostaDTO>>> GetAll()
        {
            return Ok(await Consulta().OrderBy(e => e.IdItem).ToListAsync());
        }

        //CONSULTAR O ESTOQUE DE UM ITEM
        [HttpGet("{id}")]
        public async Task<ActionResult<EstoqueRespostaDTO>> Get(int id)
        {
            var estoque = await Consulta().FirstOrDefaultAsync(e => e.IdItem == id);

            if (estoque == null)
                return NotFound(new { mensagem = "ESTOQUE NÃO LOCALIZADO!" });

            return Ok(estoque);
        }
    }
}