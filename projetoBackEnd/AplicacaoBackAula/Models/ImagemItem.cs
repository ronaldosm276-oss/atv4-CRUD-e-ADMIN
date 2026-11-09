namespace AplicacaoBackAula.Models;

public partial class ImagemItem
{
    public int Idimagem { get; set; }

    public int Iditem { get; set; }

    public string Arquivo { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public int TamanhoBytes { get; set; }

    public DateTime CriadaEm { get; set; }
}