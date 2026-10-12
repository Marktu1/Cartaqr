# Checklist de segurança

## Os 20 pontos antes de lançar

Estado verificado em outubro de 2026. ✅ implementado e testado; ➖ não se aplica (com a proteção equivalente).

| # | Ponto | Estado | Como está feito |
|---|---|---|---|
| 1 | Esconder chaves de API | ✅ | Chaves só em variáveis de ambiente do servidor; nenhuma `NEXT_PUBLIC_`. Verificado que os ficheiros enviados ao browser não contêm nomes de segredos. A API de IA já não revela o fornecedor. |
| 2 | Limpar segredos do Git | ✅ | Histórico completo analisado com gitleaks: sem fugas. `.gitignore` bloqueia `.env*`, bases de dados, chaves e certificados. O GitHub corre o gitleaks em cada push (`.github/workflows/security.yml`). |
| 3 | Chave pública da base de dados | ➖ | Não há chave de base de dados no browser: a base de dados (SQLite) só é acedida pelo servidor. |
| 4 | Row-level security | ➖ | Equivalente: cada consulta está presa ao dono (token de 32 bytes da encomenda ou da carta, ex.: `WHERE id = ? AND letter_id = ?`). Base de dados e ficheiros com permissões 0600/0700. |
| 5 | Cifrar dados sensíveis | ✅ | Email/telefone do cliente e contactos do formulário cifrados com AES-256-GCM; pesquisa por índice cego (HMAC). Todos os ficheiros (fotos, vídeos, comprovativos) cifrados no disco. PIN e passwords com bcrypt. |
| 6 | Autenticação no servidor | ✅ | Todas as páginas e ações do painel verificam a sessão no servidor (`requireAdmin`), não só o layout. |
| 7 | Bloquear acesso a registos | ✅ | Ficheiros só por URL assinado e temporário; cartas bloqueadas deixam de servir ficheiros; IDs validados como inteiros. |
| 8 | Impedir adulteração de campos | ✅ | Esquemas Zod com lista fechada de campos: preço, estado, pagamento e publicação são sempre calculados no servidor (testado a enviar `amount`, `order_status`, `is_published`). |
| 9 | Cookies de sessão seguros | ✅ | `HttpOnly`, `Secure`, prefixo `__Host-`, `SameSite=Strict` no painel, 8 h. Terminar sessão invalida todas as sessões do admin. Cookie do PIN ligado ao PIN atual. |
| 10 | Passwords com hash | ✅ | bcrypt custo 12; comparação em tempo constante mesmo para emails inexistentes; passwords de exemplo recusadas; mínimo 12 caracteres. |
| 11 | Limite de tentativas no login | ✅ | Por IP (8/15 min), por conta (5/15 min) e global. O IP vem do proxy (o `X-Forwarded-For` inventado pelo cliente é ignorado). Tentativas falhadas ficam registadas. |
| 12 | Proteção contra robôs | ✅ | Token assinado de uso único com tempo mínimo de 2 s + campo-armadilha em: encomendas, contacto, newsletter, confirmação de presença, respostas e login. |
| 13 | Consultas parametrizadas | ✅ | Todo o SQL usa parâmetros; nomes de colunas em SQL dinâmico só de listas fixas (`assertIdentifiers`). |
| 14 | Validar todas as entradas | ✅ | Zod em todas as rotas; corpo JSON limitado (64 KB por defeito) e só aceite como `application/json`; uploads com limite real mesmo sem `Content-Length`. |
| 15 | Escapar conteúdo dos utilizadores | ✅ | React escapa todo o texto; HTML removido na entrada; CSV neutraliza fórmulas; CSP com nonce como segunda barreira. |
| 16 | Restringir uploads | ✅ | Tipo detetado pelos bytes; limites de tamanho e quantidade; nome aleatório; localização GPS, XMP e comentários removidos das fotos; ficheiros servidos com `nosniff` e `sandbox`. |
| 17 | Respostas da API mínimas | ✅ | Só os campos necessários; erros genéricos sem detalhes internos (testado). |
| 18 | Cabeçalhos de segurança | ✅ | CSP com nonce por pedido, HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Permissions-Policy`, COOP, `nosniff`, `Referrer-Policy`; páginas privadas com `no-store`. |
| 19 | Forçar HTTPS | ✅ | Redirecionamento 308 para HTTPS em produção + HSTS (2 anos) + cookies `Secure`. |
| 20 | Analisar dependências | ✅ | Next.js 16.4 (corrige as falhas conhecidas). `npm run audit:security` falha com vulnerabilidades altas em produção; Dependabot semanal. Ficam apenas avisos nas ferramentas de compilação do Tailwind 3 (não chegam ao servidor nem ao browser). |

### Variáveis de ambiente recomendadas em produção
- `SESSION_SECRET` e `DATA_ENCRYPTION_KEY`: 48+ caracteres aleatórios cada (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`). Se faltarem, a app gera-os em `DATA_DIR` (funciona, mas fixá-los é melhor). **Guarda a `DATA_ENCRYPTION_KEY` num sítio seguro: sem ela os dados cifrados não se recuperam.**
- `TRUST_PROXY_HOPS=1` (Render).
- Trocar a password do admin: nova `ADMIN_PASSWORD` + `ADMIN_RESET_PASSWORD=1`, reiniciar, remover `ADMIN_RESET_PASSWORD`.
- O comando de build tem de ser `npm run build` (usa `next build --webpack`).

---

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
