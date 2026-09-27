# Studio Pérola Leite

Site e agenda online para o Studio Pérola Leite, em Lavras, MG.

## O que está implementado

- Site responsivo com serviços, galeria ampliável, localização e horário de atendimento.
- Fluxo de reserva: serviço → dia → horário → dados → revisão → confirmação.
- Persistência em Cloudflare D1, com validação de horário no servidor e prevenção de reservas simultâneas no mesmo período.
- Painel administrativo com autenticação via ChatGPT e restrição adicional ao e-mail `ADMIN_EMAIL`.
- Serviços, clientes, histórico, agenda, status, bloqueios, horários de atendimento, intervalos e configurações.
- Tabela preparada para lembretes futuros. Nenhuma mensagem automática é enviada.
- Configuração de sinal preparada. Nenhuma cobrança é feita sem integração de pagamento.

## Dados confirmados

- Atendimento: segunda a sexta, 08:00–18:00; intervalo 12:00–13:30.
- Local: Rua Evaristo Alves, 110, Lavras, MG.
- Instagram: `@studioperolaleite`.

Os preços, durações, WhatsApp e e-mail administrador ainda precisam ser fornecidos. Serviços sem duração não abrem horários para evitar reservas incorretas. Valores ausentes aparecem como “a consultar”.

## Ativação

1. Configure `ADMIN_EMAIL` como variável de ambiente do Site com o e-mail da conta ChatGPT da profissional.
2. Entre em `/admin`, revise os serviços e cadastre a duração real de cada procedimento.
3. Cadastre valores e WhatsApp, se desejado.
4. Confirme os horários e intervalos em **Configurações**.
5. Publique para as clientes somente depois de conferir os dados comerciais.

O login do painel usa a identidade encaminhada pela plataforma Sites. Não armazene senhas no projeto.

## Desenvolvimento local

Dependências: Node.js 22+ e gerenciador compatível com o lockfile. O projeto usa o starter Vinext do Sites.

```sh
npm ci
npm run db:generate
npm run build
```

Para migrações e D1 local, consulte as instruções do starter Sites no ambiente de desenvolvimento. O manifesto `.openai/hosting.json` declara o binding lógico `DB`.

## Publicação no GitHub Pages

A pasta `docs/` contém a versão estática do site para GitHub Pages: página inicial, fotos locais, galeria ampliável e navegação responsiva.

As reservas e a administração continuam em https://studio-perola-leite.duducraft11.chatgpt.site. O GitHub Pages não executa a API nem o banco D1. Os links de agendamento apontam para essa agenda e preservam o serviço selecionado. O acesso à agenda mantém a configuração existente do Site.

Para atualizar o Pages, compile o projeto, inicie o Worker local e execute `node scripts/build-github-pages.mjs`. Configure o GitHub Pages para publicar a branch `main`, pasta `/docs`.

Nenhum arquivo de credenciais, banco de dados, ambiente local ou dependências faz parte da publicação.
