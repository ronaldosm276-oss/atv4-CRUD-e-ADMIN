using AplicacaoBackAula.Models;
using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Servicos
{
    public static class ImagemArquivos
    {
        //DEFINIDA NO Program.cs (wwwroot/imagens/itens)
        public static string Pasta { get; set; } = "";

        //Path.GetFileName IMPEDE ../ NO NOME DO ARQUIVO
        public static string CaminhoDe(string arquivo) => Path.Combine(Pasta, Path.GetFileName(arquivo));

        public static string UrlDe(string arquivo) => "/imagens/itens/" + arquivo;

        public static void Apagar(string? arquivo)
        {
            if (string.IsNullOrWhiteSpace(arquivo)) return;
            try
            {
                var caminho = CaminhoDe(arquivo);
                if (File.Exists(caminho)) File.Delete(caminho);
            }
            catch (IOException) { }
        }

        //APAGA SO OS ARQUIVOS; AS LINHAS DE imagem_item SAEM POR ON DELETE CASCADE
        public static async Task ApagarDoItemAsync(BdAulaBackendContext contexto, int idItem)
        {
            var nomes = await contexto.ImagensItem
                .Where(i => i.Iditem == idItem)
                .Select(i => i.Arquivo)
                .ToListAsync();

            foreach (var nome in nomes) Apagar(nome);
        }
    }
}