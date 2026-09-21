# Checklist de segurança

Marca ✅ implementado e verificado por teste, 🔧 depende da tua configuração de produção.

## Privacidade das cartas
- ✅ Cartas privadas por defeito: só abrem depois de publicadas pelo admin (`unpublished` antes disso).
- ✅ Token de 32 bytes aleatórios (`crypto.randomBytes`) em `/carta/<token>`; o nome nunca é identificador.
- ✅ `noindex, nofollow, noarchive` na carta, em `/minha`, `/admin`; `robots.txt` bloqueia `/carta/`, `/minha/`, `/admin`, `/api/`.
- ✅ Metadados da carta genéricos (sem nomes ou títulos em Open Graph).
- ✅ Email e telefone do comprador nunca aparecem na carta pública (testado).
- ✅ PIN opcional (4–6 dígitos, hash bcrypt); o conteúdo só é enviado depois de o PIN validar no servidor (cookie assinado, 6 h); 10 tentativas / 10 min por carta.
- ✅ Ficheiros só por URL assinado com validade (HMAC + expiração), com suporte a `Range`. Sem assinatura → 403.
- ✅ Comprovativos só acessíveis por sessão de administrador.

## Uploads
- ✅ Tipo detetado pelos primeiros bytes (não confia em extensão nem `Content-Type`); SVG, HTML, PHP, executáveis rejeitados.
- ✅ Limites de tamanho (configuráveis) e de quantidade por plano, aplicados no servidor.
- ✅ Nome do ficheiro original nunca usado no disco (UUID); proteção contra path traversal.
- ✅ Ficheiros guardados fora de `public/`, com permissões `0600`.
- 🔧 Sem antivírus. Para produção considera ClamAV ou o scanner do teu storage.

## Aplicação
- ✅ SQL só com parâmetros (testado com payload de injeção).
- ✅ Texto sanitizado (`cleanText`) e sempre renderizado por React (escape automático); sem `dangerouslySetInnerHTML` com dados de utilizadores (o único uso é o SVG do QR gerado pelo servidor).
- ✅ Validação com Zod em todas as rotas.
- ✅ Rate limiting: criação de encomendas, uploads, comprovativos, IA, PIN, respostas, contacto, login.
- ✅ Erros devolvem mensagens genéricas; detalhes só no log do servidor (testado: sem stack traces).
- ✅ Cabeçalhos `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`; sem `X-Powered-By`.
- 🔧 Adiciona `Strict-Transport-Security` e uma CSP no proxy (Caddy/Nginx).
- ✅ Segredos apenas no servidor; a chave de IA nunca chega ao browser.

## Administração
- ✅ Passwords com bcrypt (custo 12); comparação em tempo constante e sem revelar se o email existe.
- ✅ Sessão em cookie `httpOnly`, `sameSite=lax`, `secure` em produção, 8 h, assinada.
- ✅ Todas as páginas e Server Actions verificam a sessão (não só o layout). Cookie forjado não entra (testado).
- ✅ Registo de ações em `admin_logs` e histórico de estados por encomenda (`order_events`).
- ✅ Pagamento nunca é confirmado por upload de ficheiro; publicação exige `payment_confirmed` (testado na lógica e no browser).
- 🔧 Sem 2FA nem recuperação de password. Muda a password do seed e restringe o acesso a `/admin` por IP/VPN se possível.

## Dados e ciclo de vida
- ✅ Eliminação completa (encomenda, carta, memórias, ficheiros) e eliminação só de conteúdos.
- ✅ Expiração automática (no acesso e por cron). 🔧 Agenda `GET /api/cron/expire` (ver README). A expiração marca a carta como expirada; usa “Eliminar conteúdos” para remover ficheiros.
- 🔧 Backups regulares da pasta `DATA_DIR`, cifrados e fora do servidor.
- 🔧 Revê as páginas de privacidade e termos com apoio jurídico (lei de proteção de dados de Angola).

## Dependências
- Next.js 15.5.x (linha com correções de segurança). `npm audit` reporta apenas `postcss` interno do Next (build-time). Corre `npm audit` e atualiza regularmente.

## Fase 3

- RSVP público: limite de taxa, nome sanitizado, máx. 10 pessoas por resposta, limite do pacote e prazo validados no servidor; só em cartas publicadas e não bloqueadas.
- Lista de convidados e CSV só com o token de gestão do cliente (ou admin); o CSV neutraliza fórmulas (`=`, `+`, `-`, `@`).
- Campos extra por categoria: só chaves da configuração são aceites; URLs só `http(s)`; HTML removido.
- Analytics: lista fechada de eventos, sem IP, cookies ou identificadores.
- Newsletter: consentimento obrigatório, email validado e normalizado, honeypot, limites por IP (10/h, 30/dia), CSV neutraliza fórmulas, exportação só para admin; saída por token aleatório.
- Cartas agendadas: enquanto bloqueadas não expõem título, texto nem ficheiros (nem aceitam respostas); o URL do cartão PDF exige o token de gestão.

## Descontos
Códigos validados só no servidor, preço final com mínimo, rate limit (15/10 min) na rota de aplicar código, uso contado apenas na confirmação do pagamento por um administrador.
