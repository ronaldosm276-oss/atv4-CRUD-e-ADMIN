using Microsoft.EntityFrameworkCore;

namespace AplicacaoBackAula.Models;

public partial class BdAulaBackendContext
{
    public virtual DbSet<Credencial> Credenciais { get; set; }

    public virtual DbSet<ImagemItem> ImagensItem { get; set; }

    //GANCHO DO CONTEXTO GERADO: UM RE-SCAFFOLD NAO APAGA ESTE ARQUIVO
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Credencial>(entity =>
        {
            entity.HasKey(e => e.Idpessoa).HasName("PRIMARY");

            entity.ToTable("credencial");

            entity.Property(e => e.Idpessoa)
                .ValueGeneratedNever()
                .HasColumnName("idpessoa");
            entity.Property(e => e.SenhaHash)
                .HasMaxLength(255)
                .HasColumnName("senha_hash");
            entity.Property(e => e.AtualizadaEm)
                .HasColumnType("datetime")
                .HasColumnName("atualizada_em");

            entity.HasOne(d => d.IdpessoaNavigation).WithOne(p => p.Credencial)
                .HasForeignKey<Credencial>(d => d.Idpessoa)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_credencial_pessoa");
        });

        modelBuilder.Entity<ImagemItem>(entity =>
        {
            entity.HasKey(e => e.Idimagem).HasName("PRIMARY");

            entity.ToTable("imagem_item");

            entity.HasIndex(e => e.Iditem, "uk_imagem_item_iditem").IsUnique();

            entity.Property(e => e.Idimagem).HasColumnName("idimagem");
            entity.Property(e => e.Iditem).HasColumnName("iditem");
            entity.Property(e => e.Arquivo)
                .HasMaxLength(100)
                .HasColumnName("arquivo");
            entity.Property(e => e.ContentType)
                .HasMaxLength(50)
                .HasColumnName("content_type");
            entity.Property(e => e.TamanhoBytes).HasColumnName("tamanho_bytes");
            entity.Property(e => e.CriadaEm)
                .HasColumnType("datetime")
                .HasColumnName("criada_em");

            entity.HasOne<Item>().WithMany()
                .HasForeignKey(d => d.Iditem)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_imagem_item_item");
        });
    }
}