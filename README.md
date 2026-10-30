# Minha Loja (Estética & Bem-Estar)

Atividade integradora do curso Programador Full Stack (SENAI Aracaju): frontend **Angular** que consome uma API **ASP.NET Core** com **Entity Framework Core** e banco **MySQL**.

O sistema tem dois módulos:

- **Loja virtual** (`/loja`): catálogo de produtos e serviços, cadastro do cliente, carrinho, confirmação do pedido e "Meus pedidos".
- **Painel administrativo** (`/admin`): resumo, clientes, funcionários, categorias, produtos, serviços, pedidos, entrada de produtos e estoque.

```
Angular (localhost:4200)  →  API ASP.NET Core (localhost:5000)  →  MySQL (bd_aula_backend)
```

## Pré-requisitos

| Ferramenta | Versão usada |
|---|---|
| MySQL Server + Workbench | 8.x |
| .NET SDK | 8.0 |
| Node.js | 22 |
| Angular CLI | 21 (`npm install -g @angular/cli`) |
| Visual Studio (opcional) | 2022, para abrir a API |

## 1. Banco de dados

1. Abra o MySQL Workbench e conecte no seu servidor.
2. Execute o script que cria o schema `bd_aula_backend` e as tabelas (`bd_aula_backend_vfinal.sql`, na pasta `Banco de dados`).
3. Execute os scripts da subpasta `scripts` na ordem: **funções**, **triggers**, **views**, **procedures** e, por último, os **dados de exemplo**. As funções vêm antes das triggers que as usam.
4. Confira: `SHOW TRIGGERS FROM bd_aula_backend;` deve listar as triggers de estoque.

> Rode os scripts de criação uma única vez. Repetir a carga duplica os dados.

## 2. API

1. Abra `AplicacaoBackAula/appsettings.json` e ajuste a *connection string* com o usuário e a senha do seu MySQL. **Não envie esse arquivo com a senha para o GitHub.**
2. Inicie a API de uma das formas:
   - **Visual Studio:** abra `AplicacaoBackAula.sln` e execute (perfil `http`).
   - **Terminal:** na pasta do projeto, `dotnet run`.
3. A API sempre escuta em **`http://localhost:5000`** (definido no `Program.cs` com `ListenLocalhost(5000)`).
4. Teste no navegador: `http://localhost:5000/swagger` (digite o `http://` completo; o Firefox pode tentar `https` e dar `PR_CONNECT_RESET_ERROR`).

## 3. Frontend

Na pasta do projeto Angular:

```bash
npm install
ng serve
```

Abra `http://localhost:4200`. A URL da API está em um único lugar: `src/app/utils/api.config.ts`.

## Como demonstrar

1. **Catálogo** (`/loja`): busque por nome e filtre por categoria e tipo.
2. **Cadastro** (`/loja/cadastro`): cadastre um cliente (CPF e e-mail não podem repetir) ou identifique-se por CPF ou e-mail.
3. **Carrinho** (`/loja/carrinho`): altere quantidades, escolha o atendente e confirme o pedido. O pedido nasce como **Aberto**.
4. **Painel** (`/admin/pedidos`): veja o pedido em aberto e mude a situação.
5. **Estoque** (`/admin/estoque`): confira a baixa do produto vendido.
6. **Entrada de produtos** (`/admin/entradas`): registre uma entrada e veja o saldo e o preço de venda atualizados.
7. **MySQL Workbench:** consulte as tabelas `atendimento`, `atendimentoitem` e `estoque` para ver os registros.

### Situações do pedido

| Letra | Situação | Pode ir para |
|---|---|---|
| A | Aberto | Em processamento, Cancelado |
| P | Em processamento | Concluído, Cancelado |
| C | Concluído | — |
| X | Cancelado | — |

As transições são validadas pela API. Ao cancelar, os produtos voltam ao estoque.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "API indisponível" no site | A API não está rodando em `localhost:5000`. |
| Swagger não abre, `PR_CONNECT_RESET_ERROR` | O navegador tentou `https`. Use `http://localhost:5000/swagger`. |
| Erro 500 ao carregar dados | Connection string errada ou MySQL desligado. |
| Catálogo vazio | Os dados de exemplo não foram carregados no banco. |
| Primeira entrada de um produto novo falha | O produto ainda não tem linha em `estoque` (confira a trigger). |

## Estrutura do frontend

```
src/app/
  components/   telas (loja e admin) e componentes reutilizáveis
  services/     um serviço HttpClient por recurso da API
  models/       interfaces dos DTOs e os códigos de situação do pedido
  utils/        URL da API, validadores e funções auxiliares
  pipes/        formatação de moeda
```

## Escopo

Não há login nem senha: o cliente é identificado por CPF ou e-mail, e o pagamento está fora desta versão. O carrinho fica no navegador até a confirmação, quando o pedido é gravado no MySQL.
