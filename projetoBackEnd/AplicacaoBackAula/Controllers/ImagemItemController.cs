using AplicacaoBackAula.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Controllers
{
    [ApiController]
    [Route("api/Item/{idItem:int}/imagem")]
    public class ImagemItemController : ControllerBase
    {
        private const long LimiteBytes = 2 * 1024 * 1024;
        private readonly BdAulaBackendContext _context;

        public ImagemItemController(BdAulaBackendContext context)
        {
            _context = context;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult> Get(int idItem)
        {
            var arquivo = await _context.ImagensItem
                .Where(i => i.Iditem == idItem)
                .Select(i => i.Arquivo)
                .FirstOrDefaultAsync();

            if (arquivo == null)
                return NotFound(new { mensagem = "ITEM SEM IMAGEM!" });

            return Ok(new { imagemUrl = ImagemArquivos.UrlDe(arquivo) });
        }

        //campo multipart: "arquivo". UM NOVO UPLOAD SUBSTITUI A IMAGEM ANTERIOR DO ITEM
        [Authorize(Roles = "Funcionario")]
        [HttpPost]
        [RequestSizeLimit(3 * 1024 * 1024)]
        public async Task<ActionResult> Post(int idItem, IFormFile arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { mensagem = "NENHUM ARQUIVO ENVIADO!" });

            if (arquivo.Length > LimiteBytes)
                return BadRequest(new { mensagem = "A IMAGEM DEVE TER NO MÁXIMO 2 MB!" });

            if (!await _context.Items.AnyAsync(i => i.Iditem == idItem))
                return NotFound(new { mensagem = "ITEM NÃO LOCALIZADO!" });

            //O TIPO VEM DOS BYTES INICIAIS DO ARQUIVO, NAO DO NOME NEM DO Content-Type ENVIADOS
            var tipo = await DetectarTipoAsync(arquivo);
            if (tipo == null)
                return BadRequest(new { mensagem = "FORMATO INVÁLIDO! ENVIE UMA IMAGEM JPG, PNG OU WEBP." });

            //NOME GERADO NO SERVIDOR: O NOME ENVIADO PELO CLIENTE NUNCA E USADO
            var nome = Guid.NewGuid().ToString("N") + tipo.Value.Extensao;
            Directory.CreateDirectory(ImagemArquivos.Pasta);

            await using (var origem = arquivo.OpenReadStream())
            await using (var destino = System.IO.File.Create(ImagemArquivos.CaminhoDe(nome)))
            {
                await origem.CopyToAsync(destino);
            }

            var existente = await _context.ImagensItem.FirstOrDefaultAsync(i => i.Iditem == idItem);
            var antigo = existente?.Arquivo;

            if (existente == null)
            {
                _context.ImagensItem.Add(new ImagemItem
                {
                    Iditem = idItem,
                    Arquivo = nome,
                    ContentType = tipo.Value.ContentType,
                    TamanhoBytes = (int)arquivo.Length,
                    CriadaEm = DateTime.Now
                });
            }
            else
            {
                existente.Arquivo = nome;
                existente.ContentType = tipo.Value.ContentType;
                existente.TamanhoBytes = (int)arquivo.Length;
                existente.CriadaEm = DateTime.Now;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                ImagemArquivos.Apagar(nome);
                return BadRequest(new { mensagem = "NÃO FOI POSSÍVEL GRAVAR A IMAGEM!" });
            }

            ImagemArquivos.Apagar(antigo);

            return Ok(new { imagemUrl = ImagemArquivos.UrlDe(nome) });
        }

        [Authorize(Roles = "Funcionario")]
        [HttpDelete]
        public async Task<IActionResult> Delete(int idItem)
        {
            var imagem = await _context.ImagensItem.FirstOrDefaultAsync(i => i.Iditem == idItem);

            if (imagem == null)
                return NotFound(new { mensagem = "ITEM SEM IMAGEM!" });

            var arquivo = imagem.Arquivo;
            _context.ImagensItem.Remove(imagem);
            await _context.SaveChangesAsync();

            ImagemArquivos.Apagar(arquivo);

            return NoContent();
        }

        //JPEG: FF D8 FF | PNG: 89 50 4E 47 0D 0A 1A 0A | WEBP: "RIFF" .... "WEBP"
        private static async Task<(string Extensao, string ContentType)?> DetectarTipoAsync(IFormFile arquivo)
        {
            var b = new byte[12];
            await using var leitura = arquivo.OpenReadStream();
            var n = await leitura.ReadAtLeastAsync(b, 12, throwOnEndOfStream: false);

            if (n >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF)
                return (".jpg", "image/jpeg");

            if (n >= 8 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47 &&
                b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A)
                return (".png", "image/png");

            if (n >= 12 && b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46 &&
                b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50)
                return (".webp", "image/webp");

            return null;
        }
    }
}