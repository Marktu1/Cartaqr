// Testes ponta a ponta contra um servidor a correr (E2E_URL). Passos de administrador usam a mesma base de dados (DATA_DIR).
// Ver TESTING.md para correr.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { PNG, JPG, MP4, EXE, PDF, SCRIPT } from './helpers';

const URL0 = process.env.E2E_URL || 'http://localhost:3111';
let O: typeof import('../src/lib/orders');
let plans: any[];
before(async () => { O = await import('../src/lib/orders'); plans = O.listPlans(); });

const j = async (path: string, init?: RequestInit) => { const r = await fetch(URL0 + path, init); let body: any = null; try { body = await r.json(); } catch { /* */ } return { status: r.status, body, headers: r.headers }; };
const post = (path: string, data: unknown, method = 'POST') => j(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const upload = (path: string, buf: Buffer, kind: string, name = 'f.bin', extra: Record<string, string> = {}) => { const f = new FormData(); f.append('file', new Blob([new Uint8Array(buf)]), name); if (kind) f.append('kind', kind); for (const [k, v] of Object.entries(extra)) f.append(k, v); return j(path, { method: 'POST', body: f }); };
const order = (slug: string, over = {}) => post('/api/orders', { occasion: 'aniversario', planId: plans.find(p => p.slug === slug).id, recipientName: 'Ana Exemplo', senderName: 'Bruno Exemplo', title: 'Para a minha pessoa favorita', contact: 'bruno@exemplo.com', language: 'pt', theme: 'romantico', ...over });

test('páginas públicas abrem (landing, preços, contacto, legais, exemplos)', async () => {
  for (const p of ['/', '/precos', '/contacto', '/privacidade', '/termos', '/criar', '/exemplos/pessoa-favorita', '/exemplos/pergunta-para-ti', '/exemplos/proximo-capitulo', '/admin/login', '/robots.txt', '/opengraph-image']) {
    const r = await fetch(URL0 + p); assert.equal(r.status, 200, p);
  }
  const home = await (await fetch(URL0 + '/')).text();
  for (const s of ['Cria uma surpresa que vai ser lembrada para sempre.', 'Criar a minha Carta QR', 'Ver exemplos', 'A tua memória merece mais do que uma mensagem comum.', 'og:image']) assert.ok(home.includes(s), s);
  assert.ok(home.includes('Essencial') && home.includes('Romântico') && home.includes('Premium') && /4\s500/.test(home) && home.includes('Eventos'));
});

test('validação de dados da encomenda', async () => {
  assert.equal((await order('essencial', { contact: 'isto-nao-e-contacto' })).status, 422);
  assert.equal((await order('essencial', { recipientName: '' })).status, 422);
  assert.equal((await post('/api/orders', { foo: 1 })).status, 422);
  assert.equal((await order('essencial', { planId: 9999 })).status, 400);
});

test('fluxo completo via API: criar → editar → IA → media → comprovativo → admin → carta → QR', async () => {
  const c = await order('romantico'); assert.equal(c.status, 201); const t = c.body.token; assert.ok(t.length >= 30);
  // IA (mock) devolve rascunho editável
  const ai = await post(`/api/ai?t=${t}`, { action: 'generate_letter', recipientName: 'Ana Exemplo', senderName: 'Bruno', occasion: 'Aniversário', tone: 'romantico', howMet: 'no trabalho', admire: 'a tua alegria', memories: [{ title: 'A praia', description: 'um dia de sol' }] });
  assert.equal(ai.status, 200); assert.equal(ai.body.draft, true); assert.match(ai.body.text, /no trabalho/);
  assert.equal((await post('/api/ai?t=token-invalido-token-invalido', { action: 'suggest_title' })).status, 404);
  assert.equal((await post(`/api/ai?t=${t}`, { action: 'nao_existe' })).status, 422);
  // texto do cliente (com tentativa de XSS) é guardado como texto
  const patch = await post(`/api/orders/${t}`, { mainMessage: ai.body.text + '\n\n<img src=x onerror=alert(1)>Fim', closingMessage: 'Parabéns!', memories: [{ title: 'A praia', description: 'um dia de sol', date: '2024-08-19' }], allowReply: true, pin: '4821' }, 'PATCH');
  assert.equal(patch.status, 200); assert.equal(patch.body.letter.hasPin, true); assert.ok(!patch.body.letter.mainMessage.includes('<img'));
  assert.equal((await post(`/api/orders/${t}`, { pin: '12' }, 'PATCH')).status, 422);
  // uploads
  const p1 = await upload(`/api/orders/${t}/media`, JPG, 'photo', 'foto.jpg'); assert.equal(p1.status, 201);
  assert.equal((await upload(`/api/orders/${t}/media`, EXE, 'photo', 'foto.jpg')).status, 415);
  assert.equal((await upload(`/api/orders/${t}/media`, SCRIPT, 'photo', 'x.png')).status, 415);
  assert.equal((await upload(`/api/orders/${t}/media`, PNG, 'nope', 'x.png')).status, 422);
  const big = await upload(`/api/orders/${t}/media`, Buffer.concat([JPG, Buffer.alloc(9 * 1024 * 1024)]), 'photo', 'grande.jpg'); assert.ok([413, 415].includes(big.status)); assert.match(big.body.error, /demasiado grande/);
  assert.equal((await upload(`/api/orders/${t}/media`, MP4, 'video', 'v.mp4')).status, 201);
  const cover = await upload(`/api/orders/${t}/media`, PNG, 'cover', 'capa.png'); assert.equal(cover.status, 201);
  // ficheiros só por URL assinado
  const state = (await j(`/api/orders/${t}`)).body; const photo = state.media.find((m: any) => m.type === 'photo');
  const ok = await fetch(URL0 + photo.url); assert.equal(ok.status, 200); assert.equal(ok.headers.get('content-type'), 'image/jpeg');
  assert.equal((await fetch(URL0 + photo.url.replace(/sig=./, 'sig=x'))).status, 403);
  assert.equal((await fetch(URL0 + `/api/media/${photo.id}`)).status, 403);
  const vid = state.media.find((m: any) => m.type === 'video'); const rng = await fetch(URL0 + vid.url, { headers: { Range: 'bytes=0-9' } }); assert.equal(rng.status, 206);
  // submeter → payment_pending, sem comprovativo não avança
  const sub = await post(`/api/orders/${t}/submit`, {}); assert.equal(sub.status, 200); assert.equal(sub.body.order.status, 'payment_pending');
  assert.equal((await j(`/api/orders/${t}/proof`, { method: 'POST', body: new FormData() })).status, 422);
  assert.equal((await upload(`/api/orders/${t}/proof`, EXE, '', 'comprovativo.pdf')).status, 415);
  assert.equal((await j(`/api/orders/${t}`)).body.order.status, 'payment_pending');
  const proof = await upload(`/api/orders/${t}/proof`, PDF, '', 'comp.pdf', { note: 'Transferência BAI' }); assert.equal(proof.status, 200);
  assert.equal(proof.body.order.status, 'proof_submitted'); assert.equal(proof.body.order.paymentStatus, 'proof_submitted');
  // QR indisponível e carta não acessível antes da publicação
  assert.equal((await j(`/api/orders/${t}/qr`)).status, 409);
  const o = O.getOrderByToken(t)!; const letter = O.getLetterByOrder(o.id)!;
  const pre = await (await fetch(URL0 + `/carta/${letter.secure_token}`)).text(); assert.ok(pre.includes('Ainda não está pronta'));
  // cliente não consegue editar/confirmar depois do admin confirmar; admin (mesma BD)
  O.adminConfirmPayment(o); O.adminPublish(O.getOrderById(o.id)!);
  assert.equal((await post(`/api/orders/${t}`, { title: 'X' }, 'PATCH')).status, 403);
  // carta pública protegida por PIN
  const url = `/carta/${letter.secure_token}`; const gate = await (await fetch(URL0 + url)).text();
  assert.ok(gate.includes('Esta carta está protegida')); assert.ok(!gate.includes('um dia de sol')); assert.ok(gate.includes('noindex'));
  const bad = await post(`/api/carta/${letter.secure_token}/pin`, { pin: '0000' }); assert.equal(bad.status, 401); assert.match(bad.body.error, /PIN incorreto/);
  const good = await fetch(URL0 + `/api/carta/${letter.secure_token}/pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: '4821' }) });
  assert.equal(good.status, 200); const cookie = (good.headers.get('set-cookie') || '').split(';')[0]; assert.match(cookie, /^pin_\d+=/);
  const open = await (await fetch(URL0 + url, { headers: { cookie } })).text();
  assert.ok(open.includes('Para a minha pessoa favorita') && open.includes('Abrir o meu presente'));
  assert.ok(!open.includes('bruno@exemplo.com') && !open.includes('+244') && !open.includes('CQ-'), 'não expõe dados do comprador');
  assert.ok(open.includes('/api/media/'), 'usa URLs assinados');
  assert.ok(open.includes('noindex'));
  // resposta do destinatário
  assert.equal((await post(`/api/carta/${letter.secure_token}/reply`, { message: 'Adorei!' })).status, 401);
  const rep = await fetch(URL0 + `/api/carta/${letter.secure_token}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ author: 'Ana', message: 'Adorei!' }) }); assert.equal(rep.status, 200);
  // QR PNG + SVG e página do cliente
  const png = await fetch(URL0 + `/api/orders/${t}/qr?format=png&download=1`); assert.equal(png.status, 200); assert.equal(png.headers.get('content-type'), 'image/png'); assert.match(png.headers.get('content-disposition') || '', /attachment/);
  const buf = Buffer.from(await png.arrayBuffer()); assert.equal(buf.subarray(1, 4).toString(), 'PNG');
  assert.equal((await fetch(URL0 + `/api/orders/${t}/qr?format=svg`)).headers.get('content-type'), 'image/svg+xml');
  const minha = await (await fetch(URL0 + `/minha/${t}`)).text(); assert.ok(minha.includes('Adorei!') && minha.includes('Lê o código para abrir o teu presente'));
  // o QR descodificado aponta para a carta (ver E2E no browser); o link aponta para APP_URL
  assert.ok(minha.includes(`localhost:3111${url}`));
});

test('carta inexistente, expirada e bloqueada mostram mensagens claras', async () => {
  const nf = await fetch(URL0 + '/carta/token-que-nao-existe-de-todo-1234'); assert.ok((await nf.text()).includes('Link inexistente'));
  const c = await order('essencial'); const o = O.getOrderByToken(c.body.token)!; const l = O.getLetterByOrder(o.id)!;
  await post(`/api/orders/${c.body.token}`, { mainMessage: 'Mensagem suficientemente longa.' }, 'PATCH'); await post(`/api/orders/${c.body.token}/submit`, {});
  await upload(`/api/orders/${c.body.token}/proof`, PDF, '', 'c.pdf');
  O.adminConfirmPayment(O.getOrderById(o.id)!); O.adminPublish(O.getOrderById(o.id)!);
  assert.ok((await (await fetch(URL0 + `/carta/${l.secure_token}`)).text()).includes('Abrir o meu presente'));
  O.adminBlock(O.getOrderById(o.id)!, true); assert.ok((await (await fetch(URL0 + `/carta/${l.secure_token}`)).text()).includes('Carta indisponível')); O.adminBlock(O.getOrderById(o.id)!, false);
  const { run } = await import('../src/lib/db'); run(`UPDATE letters SET expires_at = datetime('now','-1 hour') WHERE id = ?`, l.id);
  assert.ok((await (await fetch(URL0 + `/carta/${l.secure_token}`)).text()).includes('Esta carta expirou'));
});

test('limite de fotografias do plano Essencial é aplicado no servidor', async () => {
  const c = await order('essencial'); const t = c.body.token;
  for (let i = 0; i < 6; i++) assert.equal((await upload(`/api/orders/${t}/media`, JPG, 'photo', `f${i}.jpg`)).status, 201);
  const r = await upload(`/api/orders/${t}/media`, JPG, 'photo', 'f7.jpg'); assert.equal(r.status, 409); assert.match(r.body.error, /até 6 fotografias/);
  assert.equal((await upload(`/api/orders/${t}/media`, MP4, 'video', 'v.mp4')).status, 409);
});

test('14. acesso não autorizado ao painel e aos comprovativos', async () => {
  for (const p of ['/admin', '/admin/settings', '/admin/mensagens', '/admin/orders/1', '/admin/orders/1/preview']) {
    const r = await fetch(URL0 + p, { redirect: 'manual' }); assert.ok([302, 303, 307, 308].includes(r.status), `${p} → ${r.status}`); assert.match(r.headers.get('location') || '', /\/admin\/login/);
  }
  assert.equal((await fetch(URL0 + '/api/admin/proof/1')).status, 401);
  assert.equal((await fetch(URL0 + '/api/cron/expire')).status, 401);
  assert.equal((await fetch(URL0 + '/api/cron/expire', { headers: { authorization: 'Bearer errado' } })).status, 401);
  assert.equal((await fetch(URL0 + '/api/cron/expire', { headers: { authorization: 'Bearer e2e-cron' } })).status, 200);
  // cookie de admin forjado não funciona
  const r = await fetch(URL0 + '/admin', { redirect: 'manual', headers: { cookie: 'cq_admin=1:9999999999.assinaturafalsa' } }); assert.match(r.headers.get('location') || '', /login/);
});

test('evento: só com pacote de Eventos; RSVP público; cliente vê confirmações; CSV protegido', async () => {
  const ev = { occasion: 'convite-casamento', theme: 'gala', specialDate: '2099-06-19', title: 'Vamos celebrar', recipientName: 'Família e amigos', extra: { time: '16:00', venue: 'Salão Exemplo' } };
  assert.equal((await order('romantico', ev)).status, 400); // plano de cartas não serve para eventos
  assert.equal((await order('evento-basico', { ...ev, extra: {} })).status, 422); // faltam hora/local
  const c = await order('evento-basico', ev); assert.equal(c.status, 201); const t = c.body.token;
  await post(`/api/orders/${t}`, { mainMessage: 'Estás convidado para o nosso grande dia.' }, 'PATCH');
  await post(`/api/orders/${t}/submit`, {}); await upload(`/api/orders/${t}/proof`, PDF, '', 'c.pdf');
  const o = O.getOrderByToken(t)!; const letter = O.getLetterByOrder(o.id)!; const tok = letter.secure_token;
  assert.equal((await post(`/api/carta/${tok}/rsvp`, { name: 'João', attending: 'yes', guests: 2 })).status, 404); // ainda não publicada
  O.adminConfirmPayment(o); O.adminPublish(O.getOrderById(o.id)!);
  const page = await (await fetch(URL0 + `/carta/${tok}`)).text();
  assert.ok(page.includes('Salão Exemplo') && page.includes('Abrir o convite'));
  assert.equal((await post(`/api/carta/${tok}/rsvp`, { name: 'João Silva', attending: 'yes', guests: 2, message: 'Lá estaremos' })).status, 200);
  assert.equal((await post(`/api/carta/${tok}/rsvp`, { name: '', attending: 'yes', guests: 1 })).status, 422);
  assert.equal((await post(`/api/carta/${tok}/rsvp`, { name: 'X', attending: 'talvez-sim', guests: 1 })).status, 422);
  const minha = await (await fetch(URL0 + `/minha/${t}`)).text(); assert.ok(minha.includes('João Silva') && minha.includes('Confirmações de presença') && minha.includes('Convite QR'));
  const csv = await fetch(URL0 + `/api/orders/${t}/rsvps`); assert.equal(csv.status, 200); assert.match(await csv.text(), /João Silva/);
  assert.equal((await fetch(URL0 + `/api/orders/token-errado-token-errado-1234/rsvps`)).status, 404);
});

test('pedido de namoro: resposta guardada com texto da configuração', async () => {
  const c = await order('essencial', { occasion: 'pedido-namoro', theme: 'elegante' }); assert.equal(c.status, 201); const t = c.body.token;
  await post(`/api/orders/${t}`, { mainMessage: 'Tenho uma pergunta muito importante para ti.' }, 'PATCH');
  await post(`/api/orders/${t}/submit`, {}); await upload(`/api/orders/${t}/proof`, PDF, '', 'c.pdf');
  const o = O.getOrderByToken(t)!; const tok = O.getLetterByOrder(o.id)!.secure_token; O.adminConfirmPayment(o); O.adminPublish(O.getOrderById(o.id)!);
  const page = await (await fetch(URL0 + `/carta/${tok}`)).text(); assert.ok(page.includes('Abrir'));
  const r = await post(`/api/carta/${tok}/reply`, { author: 'Carla', choice: 'yes', message: '<b>hack</b>' }); assert.equal(r.status, 200);
  const rep = O.listReplies(O.getLetterByOrder(o.id)!.id); assert.equal(rep[0].kind, 'answer'); assert.ok(!rep[0].message.includes('hack'));
});

test('páginas de categoria, preços de eventos, sitemap e analytics', async () => {
  const pr = await (await fetch(URL0 + '/precos')).text(); assert.ok(/4\s500/.test(pr) && /25\s000/.test(pr) && /80\s000/.test(pr) && pr.includes('Eventos'));
  for (const s of ['amor', 'pedido-namoro', 'convite-casamento']) { const r = await fetch(URL0 + `/ocasioes/${s}`); assert.equal(r.status, 200, s); }
  assert.equal((await fetch(URL0 + '/ocasioes/nao-existe')).status, 404);
  assert.match(await (await fetch(URL0 + '/sitemap.xml')).text(), /ocasioes\/convite-casamento/);
  assert.equal((await post('/api/track', { name: 'landing_view' })).status, 204); assert.equal((await post('/api/track', { name: '<x>' })).status, 204);
  assert.ok(O.analyticsSummary(1).landing >= 1);
});

test('newsletter, cartão PDF e entrega agendada via HTTP', async () => {
  assert.equal((await post('/api/newsletter', { email: 'a@b.com', consent: false, source: 'popup' })).status, 422); // sem consentimento
  assert.equal((await post('/api/newsletter', { email: 'invalido', consent: true, source: 'popup' })).status, 422);
  assert.equal((await post('/api/newsletter', { email: 'robo@spam.com', consent: true, source: 'popup', website: 'http://spam' })).status, 200);
  assert.equal((await post('/api/newsletter', { email: 'cliente@exemplo.com', consent: true, source: 'popup' })).status, 200);
  assert.equal((await post('/api/newsletter', { email: 'CLIENTE@exemplo.com', consent: true, source: 'footer' })).status, 200);
  const N = await import('../src/lib/newsletter'); const subs = N.listSubscribers();
  assert.equal(subs.filter(x => x.email === 'cliente@exemplo.com').length, 1); assert.ok(!subs.some(x => x.email === 'robo@spam.com'), 'honeypot não regista');
  assert.equal((await fetch(URL0 + '/api/admin/newsletter')).status, 401); assert.equal((await fetch(URL0 + '/admin/newsletter', { redirect: 'manual' })).status >= 300, true);
  const t = subs.find(x => x.email === 'cliente@exemplo.com')!.unsub_token;
  assert.equal((await post('/api/newsletter/sair', { token: 'x'.repeat(30) })).status, 404); assert.equal((await post('/api/newsletter/sair', { token: t })).status, 200);
  // cartão PDF e agendamento
  const c = await order('romantico'); const tk = c.body.token;
  assert.equal((await fetch(URL0 + `/api/orders/${tk}/card`)).status, 409); // ainda não publicada
  const soon = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 16);
  assert.equal((await post(`/api/orders/${tk}`, { mainMessage: 'Uma mensagem longa o suficiente.', unlockAt: '2001-01-01T10:00' }, 'PATCH')).status, 422);
  assert.equal((await post(`/api/orders/${tk}`, { mainMessage: 'Uma mensagem longa o suficiente.', unlockAt: soon }, 'PATCH')).status, 200);
  await post(`/api/orders/${tk}/submit`, {}); await upload(`/api/orders/${tk}/proof`, PDF, '', 'c.pdf');
  const o = O.getOrderByToken(tk)!; const tok = O.getLetterByOrder(o.id)!.secure_token; O.adminConfirmPayment(o); O.adminPublish(O.getOrderById(o.id)!);
  const locked = await (await fetch(URL0 + `/carta/${tok}`)).text();
  assert.ok(locked.includes('Uma surpresa está a caminho') && !locked.includes('Uma mensagem longa') && !locked.includes('Para a minha pessoa favorita'), 'carta agendada não revela conteúdo');
  assert.equal((await post(`/api/carta/${tok}/reply`, { message: 'oi' })).status, 404, 'sem respostas enquanto bloqueada');
  for (const size of ['a6', 'mini', 'a4']) { const r = await fetch(URL0 + `/api/orders/${tk}/card?size=${size}`); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'application/pdf'); assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 5).toString(), '%PDF-'); }
  assert.equal((await fetch(URL0 + `/api/orders/token-errado-token-errado-1234/card`)).status, 404);
  const minha = await (await fetch(URL0 + `/minha/${tk}`)).text(); assert.ok(minha.includes('Entrega agendada') && minha.includes('Cartão A6'));
});

test('descontos e promoções: código via API, promoção só aparece quando ativa', async () => {
  const D = await import('../src/lib/db');
  try { O.createDiscountCode({ code: 'E2E10', kind: 'percent', value: 10, appliesTo: 'all', maxUses: 5 }); } catch { /* já existe */ }
  const ess = plans.find(p => p.slug === 'essencial');
  const c = await order('essencial'); const t = c.body.token; assert.equal((await j(`/api/orders/${t}`)).body.order.amount, ess.price);
  assert.equal((await post(`/api/orders/${t}/discount`, { code: 'NAOEXISTE' })).status, 422);
  assert.equal((await post(`/api/orders/${t}/discount`, {})).status, 422);
  assert.equal((await post('/api/orders/token-invalido-token-invalido/discount', { code: 'E2E10' })).status, 404);
  const ap = await post(`/api/orders/${t}/discount`, { code: ' e2e10 ' });
  assert.equal(ap.status, 200); assert.equal(ap.body.order.discountCode, 'E2E10'); assert.equal(ap.body.order.amount, ess.price - Math.round(ess.price * 0.1)); assert.ok(ap.body.order.amount >= 500);
  const rm = await post(`/api/orders/${t}/discount`, {}, 'DELETE'); assert.equal(rm.status, 200); assert.equal(rm.body.order.amount, ess.price); assert.equal(rm.body.order.discountCode, null);
  // sem promoção ativa não há riscado nem "Promoção"
  let html = await (await fetch(URL0 + '/precos')).text(); assert.ok(!html.includes('Preço promocional até'));
  D.run(`UPDATE plans SET promo_price = 3900, promo_ends_at = datetime('now', '+5 days') WHERE id = ?`, ess.id);
  html = await (await fetch(URL0 + '/precos')).text(); assert.ok(html.includes('Preço promocional até') && /3\s900/.test(html));
  const c2 = await order('essencial'); assert.equal((await j(`/api/orders/${c2.body.token}`)).body.order.amount, 3900);
  D.run(`UPDATE plans SET promo_price = 3900, promo_ends_at = datetime('now', '-1 hours') WHERE id = ?`, ess.id);
  html = await (await fetch(URL0 + '/precos')).text(); assert.ok(!html.includes('Preço promocional até'), 'promoção expirada desaparece');
  D.run('UPDATE plans SET promo_price = NULL, promo_ends_at = NULL WHERE id = ?', ess.id);
});

test('rate limiting nas rotas públicas e de IA', async () => {
  const c = await order('essencial'); const t = c.body.token; let limited = 0;
  for (let i = 0; i < 20; i++) { const r = await post(`/api/ai?t=${t}`, { action: 'suggest_title', recipientName: 'A' }); if (r.status === 429) limited++; }
  assert.ok(limited > 0, 'IA deve ser limitada');
  let contact = 0; for (let i = 0; i < 8; i++) { const r = await post('/api/contact', { name: 'X', contact: 'x@y.pt', message: 'Olá, tenho uma dúvida.' }); if (r.status === 429) contact++; } assert.ok(contact > 0);
});

test('cabeçalhos de segurança e sem fuga de detalhes internos', async () => {
  (await import('../src/lib/db')).run('DELETE FROM rate_limits'); // os testes anteriores esgotam os limites por IP
  const r = await fetch(URL0 + '/'); assert.equal(r.headers.get('x-content-type-options'), 'nosniff'); assert.equal(r.headers.get('x-frame-options'), 'DENY'); assert.ok(!r.headers.get('x-powered-by'));
  const e = await j('/api/orders/token-invalido-token-invalido'); assert.equal(e.status, 404); assert.ok(!JSON.stringify(e.body).match(/stack|at .*\(|sqlite|node_modules/i));
  const bad = await fetch(URL0 + '/api/orders', { method: 'POST', body: '{"rompido"' }); assert.equal(bad.status, 422);
});
