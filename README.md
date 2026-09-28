# Studio Pérola Leite

Site completo e agenda online para o Studio Pérola Leite, Lavras, MG.

## Páginas publicadas no GitHub Pages

- Início: https://duduwwl.github.io/studio-perola-leite/
- Agendamento: https://duduwwl.github.io/studio-perola-leite/agendar/
- Administração: https://duduwwl.github.io/studio-perola-leite/admin/

O agendamento funciona diretamente no GitHub Pages: serviço, calendário de datas disponíveis, horários, dados da cliente, revisão, confirmação e exportação de calendário. A API e o banco persistente Cloudflare D1 permanecem em https://studio-perola-leite.duducraft11.chatgpt.site. O Pages hospeda HTML, CSS e JavaScript; a API recebe reservas e impede sobreposição no servidor. Nenhuma reserva é armazenada apenas no navegador.

## Administração

O painel do Pages oferece visão geral, agenda por dia/semana/mês, serviços, clientes, histórico, alterações de reservas, bloqueios e configurações. O botão Entrar com ChatGPT abre a autenticação da plataforma em uma janela separada. Mantenha essa janela aberta enquanto usa o painel: ela realiza as consultas administrativas no mesmo domínio da sessão autenticada e entrega as respostas exclusivamente à janela do painel em https://duduwwl.github.io. Não são criados nem expostos tokens, senhas ou chaves no Pages.

Cada consulta e alteração administrativa exige identidade ChatGPT e o e-mail autorizado em ADMIN_EMAIL no servidor. Os dados privados não são incluídos em HTML, arquivos estáticos, pacotes ou repositório. A agenda para clientes e sua disponibilidade são públicas; a administração continua restrita.

## Serviços e atendimento

Preços fictícios, identificados como demonstração no fluxo de reserva:

| Serviço | Duração | Preço fictício |
| --- | --- | --- |
| Alongamento em fibra de vidro | 60 min | R$ 150,00 |
| Alongamento em gel | 50 min | R$ 130,00 |
| Esmaltação em gel | 30 min | R$ 60,00 |
| Blindagem e esmaltação em gel | 60 min | R$ 90,00 |
| Cutilagem e esmaltação comum | 50 min | R$ 45,00 |

Segunda a sexta, das 08h às 18h; almoço das 12h às 13h30. Fuso America/Sao_Paulo. Rua Evaristo Alves, 110, Lavras, MG. Instagram @studioperolaleite.

## Desenvolvimento e publicação

Node.js 22+, dependências do lockfile e starter Vinext/Sites.

1. Instale as dependências com npm ci.
2. Compile a API e o site com npm run build.
3. Inicie o Worker local com npm start (porta 8787).
4. Gere a página inicial com node scripts/build-github-pages.mjs http://127.0.0.1:8787.
5. Compile as páginas interativas com npm run build:pages.
6. Publique a API usando Sites e o projeto em .openai/hosting.json, preservando D1 e as migrações.
7. Publique o GitHub Pages a partir de main, pasta /docs.

A compilação das páginas reutiliza os componentes de reserva e administração do site. Os links respeitam o prefixo /studio-perola-leite/. O acesso público da agenda é necessário para a API de reservas anônimas. A conta administradora é definida em ADMIN_EMAIL no ambiente de produção.

Sem cobranças ou envio automático de mensagens. As integrações de calendário exportam eventos, sem sincronização de agendas externas. Credenciais, ambiente local, banco e dependências não devem ser publicados.
