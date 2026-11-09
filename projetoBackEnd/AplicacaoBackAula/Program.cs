using System.Text;
using AplicacaoBackAula.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// FORÇA A API A ESCUTAR SOMENTE EM http://localhost:5000 (SE SOBREPÕE AO PERFIL DO VISUAL STUDIO)
builder.WebHost.ConfigureKestrel(o => o.ListenLocalhost(5000));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    //BOTAO Authorize DO SWAGGER: COLE SOMENTE O TOKEN RETORNADO EM /api/Auth/login
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Cole somente o token JWT retornado em /api/Auth/login."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<BdAulaBackendContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("connection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("connection"))
    )
);

// JWT: A CHAVE FICA EM dotnet user-secrets, NUNCA NO appsettings.json
var chaveJwt = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(chaveJwt) || Encoding.UTF8.GetByteCount(chaveJwt) < 32)
    throw new InvalidOperationException(
        "Configure Jwt:Key (minimo 32 caracteres): dotnet user-secrets set \"Jwt:Key\" \"<chave>\"");

builder.Services.AddSingleton<TokenService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false; // MANTEM OS NOMES CURTOS: sub, name, role
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chaveJwt)),
            NameClaimType = "name",
            RoleClaimType = "role"
        };
    });
builder.Services.AddAuthorization();

// PASTA DAS IMAGENS: wwwroot/imagens/itens (CRIADA AQUI SE NAO EXISTIR)
var wwwroot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
var pastaImagens = Path.Combine(wwwroot, "imagens", "itens");
Directory.CreateDirectory(pastaImagens);
AplicacaoBackAula.Servicos.ImagemArquivos.Pasta = pastaImagens;

var app = builder.Build();

// SEED SO EM DESENVOLVIMENTO: QUEM AINDA NAO TEM CREDENCIAL RECEBE A SENHA INICIAL DO user-secrets (Seed:SenhaInicial)
if (app.Environment.IsDevelopment())
{
    var senhaInicial = app.Configuration["Seed:SenhaInicial"];
    if (!string.IsNullOrEmpty(senhaInicial))
    {
        var erroSeed = AplicacaoBackAula.Servicos.PoliticaSenha.Validar(senhaInicial);
        if (erroSeed != null)
            throw new InvalidOperationException("Seed:SenhaInicial invalida: " + erroSeed);

        using var escopo = app.Services.CreateScope();
        var db = escopo.ServiceProvider.GetRequiredService<BdAulaBackendContext>();

        var semSenha = db.Pessoas
            .Where(p => !db.Credenciais.Any(c => c.Idpessoa == p.Idpessoa))
            .Select(p => p.Idpessoa)
            .ToList();

        foreach (var id in semSenha)
        {
            db.Credenciais.Add(new Credencial
            {
                Idpessoa = id,
                SenhaHash = AplicacaoBackAula.Servicos.Senhas.Hash(senhaInicial),
                AtualizadaEm = DateTime.Now
            });
        }

        if (semSenha.Count > 0)
        {
            db.SaveChanges();
            Console.WriteLine($"[seed] senha inicial definida para {semSenha.Count} cadastro(s).");
        }
    }
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(wwwroot),
    OnPrepareResponse = ctx => ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff"
});

app.UseCors(o => o.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();