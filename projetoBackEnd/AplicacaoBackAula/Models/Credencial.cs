using System.Text.Json.Serialization;

namespace AplicacaoBackAula.Models;

public partial class Credencial
{
    public int Idpessoa { get; set; }

    //NUNCA SERIALIZAR O HASH, MESMO QUE UMA ENTIDADE VAZE POR ENGANO
    [JsonIgnore]
    public string SenhaHash { get; set; } = null!;

    public DateTime AtualizadaEm { get; set; }

    public virtual Pessoa IdpessoaNavigation { get; set; } = null!;
}