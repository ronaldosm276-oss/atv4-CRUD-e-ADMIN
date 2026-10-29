using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AplicacaoBackAula.DTO;
using AplicacaoBackAula.Models;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemController : ControllerBase
    {
        //DECLARAÇÃO DO ATRIBUTO DE CONTEXTO
        private readonly BdAulaBackendContext _context;

        //DECLARAÇÃO DO MÉTODO CONSTRUTOR
        public ItemController(BdAulaBackendContext context)
        {
            _context = context;
        }

        //DECLARAÇÃO DO MÉTODO PARA LISTAR TODOS OS ITENS (PRODUTOS E SERVIÇOS)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemDTO>>> GetAll()
        {
            var itens = await _context.Items
                .OrderBy(i => i.Iditem)
                .Select(i => new ItemDTO
                {
                    IdItem = i.Iditem,
                    IdCategoria = i.Idcategoria,
                    Item = i.Item1,
                    DescricaoItem = i.DescricaoItem,
                    Preco = i.Preco,
                    TipoItem = i.TipoItem,
                    AtivoProdutoServico = i.AtivoProdutoServico,
                    Categoria = i.IdcategoriaNavigation.Categoria
                }).ToListAsync();

            return Ok(itens);

        }//FIM MÉTODO GetAll

        //DECLARAÇÃO DO MÉTODO PARA BUSCAR UM ITEM PELO ID
        [HttpGet("{id}")]
        public async Task<ActionResult<ItemDTO>> GetItem(int id)
        {
            var item = await _context.Items
                .Where(i => i.Iditem == id)
                .Select(i => new ItemDTO
                {
                    IdItem = i.Iditem,
                    IdCategoria = i.Idcategoria,
                    Item = i.Item1,
                    DescricaoItem = i.DescricaoItem,
                    Preco = i.Preco,
                    TipoItem = i.TipoItem,
                    AtivoProdutoServico = i.AtivoProdutoServico,
                    Categoria = i.IdcategoriaNavigation.Categoria
                }).FirstOrDefaultAsync();

            //VERIFICA SE O ITEM EXISTE
            if (item == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ITEM NÃO LOCALIZADO!"
                    });
            }

            return Ok(item);

        }//FIM MÉTODO GetItem

        //DECLARAÇÃO DO MÉTODO PARA CADASTRAR UM SERVIÇO
        [HttpPost]
        public async Task<ActionResult<ItemDTO>> Post(ItemDTO dto)
        {
            //VALIDA OS DADOS ANTES DE CONSULTAR O BANCO
            var erro = ValidarItem(dto);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            //VERIFICA SE A CATEGORIA EXISTE
            bool categoriaExiste = await _context.Categoria
                .AnyAsync(c => c.Idcategoria == dto.IdCategoria);

            if (!categoriaExiste)
            {
                return NotFound(
                    new
                    {
                        mensagem = "CATEGORIA NÃO LOCALIZADA!"
                    });
            }

            //PROJETA OS DADOS DO DTO PARA O MODELO Item
            var item = new Item
            {
                Idcategoria = dto.IdCategoria,
                Item1 = dto.Item,
                DescricaoItem = dto.DescricaoItem,
                Preco = dto.Preco,
                TipoItem = dto.TipoItem,
                AtivoProdutoServico = dto.AtivoProdutoServico
            };

            _context.Items.Add(item);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { mensagem = "NÃO FOI POSSÍVEL GRAVAR! VERIFIQUE OS DADOS INFORMADOS." });
            }

            //DEVOLVE OS DADOS COM O ID QUE O BANCO GEROU
            dto.IdItem = item.Iditem;

            return CreatedAtAction(
                nameof(GetItem),
                new { id = item.Iditem },
                dto);

        }//FIM MÉTODO Post

        //DECLARAÇÃO DO MÉTODO PARA ATUALIZAR UM SERVIÇO
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, ItemDTO dto)
        {
            //VALIDA OS DADOS ANTES DE CONSULTAR O BANCO
            var erro = ValidarItem(dto);
            if (erro != null)
            {
                return BadRequest(new { mensagem = erro });
            }

            //BUSCA O ITEM
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Iditem == id);

            //VERIFICA SE O ITEM EXISTE
            if (item == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ITEM NÃO LOCALIZADO!"
                    });
            }

            //PRODUTO TEM ESTOQUE E PREÇO DE VENDA: É ALTERADO PELO ProdutoItemController
            if (item.TipoItem != "S")
            {
                return BadRequest(
                    new
                    {
                        mensagem = "ESTE CONTROLLER ALTERA SOMENTE SERVIÇOS! USE O ProdutoItem PARA PRODUTOS."
                    });
            }

            //VERIFICA SE A CATEGORIA EXISTE
            bool categoriaExiste = await _context.Categoria
                .AnyAsync(c => c.Idcategoria == dto.IdCategoria);

            if (!categoriaExiste)
            {
                return NotFound(
                    new
                    {
                        mensagem = "CATEGORIA NÃO LOCALIZADA!"
                    });
            }

            //COPIA OS DADOS DO DTO PARA O MODELO
            item.Idcategoria = dto.IdCategoria;
            item.Item1 = dto.Item;
            item.DescricaoItem = dto.DescricaoItem;
            item.Preco = dto.Preco;
            item.AtivoProdutoServico = dto.AtivoProdutoServico;

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

        //DECLARAÇÃO DO MÉTODO PARA EXCLUIR UM SERVIÇO
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            //BUSCA O ITEM
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Iditem == id);

            //VERIFICA SE O ITEM EXISTE
            if (item == null)
            {
                return NotFound(
                    new
                    {
                        mensagem = "ITEM NÃO LOCALIZADO!"
                    });
            }

            //PRODUTO TEM ESTOQUE E ENTRADAS VINCULADOS: É EXCLUÍDO PELO ProdutoItemController
            if (item.TipoItem != "S")
            {
                return BadRequest(
                    new
                    {
                        mensagem = "ESTE CONTROLLER EXCLUI SOMENTE SERVIÇOS! USE O ProdutoItem PARA PRODUTOS."
                    });
            }

            //VERIFICA SE O SERVIÇO JÁ FOI USADO EM ALGUM ATENDIMENTO (FK atendimentoitem.iditem)
            bool usadoEmAtendimento = await _context.Atendimentoitems
                .AnyAsync(ai => ai.Iditem == id);

            if (usadoEmAtendimento)
            {
                return Conflict(
                    new
                    {
                        mensagem = "NÃO É POSSÍVEL EXCLUIR: O SERVIÇO POSSUI ATENDIMENTOS VINCULADOS!"
                    });
            }

            _context.Items.Remove(item);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                //REDE DE SEGURANÇA: ALGUÉM CRIOU UM VÍNCULO ENTRE O AnyAsync E O SaveChanges
                return Conflict(new { mensagem = "NÃO É POSSÍVEL EXCLUIR: EXISTEM REGISTROS VINCULADOS AO SERVIÇO!" });
            }

            return NoContent();

        }//FIM MÉTODO Delete

        //MÉTODO PRIVADO DE VALIDAÇÃO: DEVOLVE A MENSAGEM DE ERRO OU null SE ESTIVER TUDO CERTO
        private static string? ValidarItem(ItemDTO dto)
        {
            if (dto.IdCategoria <= 0)
                return "CATEGORIA INVÁLIDA!";

            if (string.IsNullOrWhiteSpace(dto.Item) || dto.Item.Length > 40)
                return "NOME DO ITEM OBRIGATÓRIO E COM ATÉ 40 CARACTERES!";

            if (string.IsNullOrWhiteSpace(dto.DescricaoItem) || dto.DescricaoItem.Length > 200)
                return "DESCRIÇÃO OBRIGATÓRIA E COM ATÉ 200 CARACTERES!";

            if (dto.Preco <= 0 || dto.Preco > 99999999.99m)
                return "PREÇO DEVE ESTAR ENTRE 0,01 E 99.999.999,99!";

            if (decimal.Round(dto.Preco, 2) != dto.Preco)
                return "PREÇO COM NO MÁXIMO 2 CASAS DECIMAIS!";

            if (dto.TipoItem != "S")
                return "ESTE CONTROLLER GERENCIA SOMENTE SERVIÇOS! TIPO DO ITEM DEVE SER S.";

            if (dto.AtivoProdutoServico != "S" && dto.AtivoProdutoServico != "N")
                return "ATIVO DEVE SER S OU N!";

            return null;

        }//FIM MÉTODO ValidarItem

    }//FIM CLASSE
}//FIM NAMESPACE