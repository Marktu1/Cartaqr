import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { freshEnv, PNG, JPG, MP4, MP3, EXE, SCRIPT, SVG, PDF, baseOrder } from './helpers';

let E: Awaited<ReturnType<typeof freshEnv>>;
before(async () => { E = await freshEnv(); });
const plan = (slug: string) => E.O.listPlans().find(p => p.slug === slug)!;

test('1+2. Criar encomenda do início ao fim, para cada plano', () => {
  for (const slug of ['essencial', 'romantico', 'premium']) {
    const { order, letter } = E.O.createOrder(baseOrder(plan(slug).id) as any);
    assert.equal(order.order_status, 'draft'); assert.equal(order.payment_status, 'unpaid');
    assert.equal(order.amount, plan(slug).price); assert.match(order.public_reference, /^CQ-[A-Z2-9]{6}$/);
    assert.ok(letter.secure_token.length >= 32, 'token longo'); assert.ok(!letter.secure_token.includes('ana'));
    assert.equal(order.customer_phone, '+244923456789');
  }
});

test('3. Upload de imagens válidas + limites por plano', () => {
  const { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any);
  for (let i = 0; i < 6; i++) E.O.addMedia(order, 'photo', i % 2 ? PNG : JPG, `f${i}.jpg`);
  assert.throws(() => E.O.addMedia(order, 'photo', PNG, 'x.png'), /até 6 fotografias/);
  assert.throws(() => E.O.addMedia(order, 'video', MP4, 'v.mp4'), /não inclui vídeo/);
  assert.throws(() => E.O.addMedia(order, 'audio', MP3, 'a.mp3'), /não inclui áudio/);
  const { order: o2 } = E.O.createOrder(baseOrder(plan('romantico').id) as any);
  E.O.addMedia(o2, 'video', MP4, 'v.mp4'); E.O.addMedia(o2, 'audio', MP3, 'a.mp3');
  assert.throws(() => E.O.addMedia(o2, 'video', MP4, 'v2.mp4'), /até 1 vídeo/);
});

test('4. Rejeição de ficheiros inválidos', () => {
  const { order } = E.O.createOrder(baseOrder(plan('premium').id) as any);
  for (const [name, buf] of [['virus.jpg', EXE], ['shell.jpg', SCRIPT], ['xss.png', SVG], ['doc.jpg', PDF]] as const) {
    assert.throws(() => E.O.addMedia(order, 'photo', buf, name), /não permitido|apenas/, name);
  }
  assert.throws(() => E.O.addMedia(order, 'photo', MP4, 'x.jpg'), /apenas/); // vídeo no campo de foto
  const big = Buffer.concat([JPG, Buffer.alloc(9 * 1024 * 1024)]);
  assert.throws(() => E.O.addMedia(order, 'photo', big, 'grande.jpg'), /demasiado grande.*8 MB/);
  assert.equal(E.O.getMedia(E.O.getLetterByOrder(order.id)!.id).length, 0);
  // o nome do ficheiro enviado nunca é usado no disco
  const m = E.O.addMedia(order, 'photo', JPG, '../../etc/passwd.jpg'); assert.match(m.storage_path, /^\d+\/[0-9a-f-]{36}\.jpg$/);
});

test('7+8. Comprovativo não confirma pagamento; só o admin confirma; publicar exige confirmação', () => {
  let { order } = E.O.createOrder(baseOrder(plan('romantico').id) as any);
  E.O.updateLetter(order, { mainMessage: 'Uma mensagem com mais de dez caracteres.' });
  assert.throws(() => E.O.adminPublish(order), /antes de confirmar o pagamento/);
  E.O.submitOrder(order); order = E.O.getOrderById(order.id)!; assert.equal(order.order_status, 'payment_pending');
  assert.throws(() => E.O.submitProof(order, Buffer.from('lixo lixo lixo lixo'), ''), /não permitido/);
  E.O.submitProof(order, PDF, 'ref 123'); order = E.O.getOrderById(order.id)!;
  assert.equal(order.order_status, 'proof_submitted'); assert.equal(order.payment_status, 'proof_submitted');
  assert.notEqual(order.payment_status, 'confirmed');
  assert.throws(() => E.O.adminPublish(order), /antes de confirmar/);
  assert.equal(E.O.resolvePublicLetter(E.O.getLetterByOrder(order.id)!.secure_token).state, 'unpublished');
  E.O.adminConfirmPayment(order); order = E.O.getOrderById(order.id)!;
  assert.equal(order.order_status, 'payment_confirmed'); assert.equal(order.payment_status, 'confirmed');
  E.O.adminPublish(order); order = E.O.getOrderById(order.id)!;
  assert.equal(order.order_status, 'published');
  const r = E.O.resolvePublicLetter(E.O.getLetterByOrder(order.id)!.secure_token); assert.equal(r.state, 'ok');
});

test('submeter sem mensagem é bloqueado', () => {
  const { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any);
  assert.throws(() => E.O.submitOrder(order), /mensagem principal/);
});

test('cliente não edita depois da confirmação', () => {
  let { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any);
  E.O.updateLetter(order, { mainMessage: 'Mensagem longa o bastante.' }); E.O.submitOrder(order);
  order = E.O.getOrderById(order.id)!; E.O.submitProof(order, PDF, ''); E.O.adminConfirmPayment(E.O.getOrderById(order.id)!);
  assert.throws(() => E.O.updateLetter(E.O.getOrderById(order.id)!, { title: 'Hack' }), /não pode ser editada/);
});

test('9. Carta pública: token inexistente e formatos inválidos', () => {
  assert.equal(E.O.resolvePublicLetter('nao-existe-nao-existe-nao-existe').state, 'notfound');
  assert.equal(E.O.resolvePublicLetter('abc').state, 'notfound');
  assert.equal(E.O.resolvePublicLetter("' OR 1=1 --").state, 'notfound');
});

test('11. PIN: hash, verificação e cookie assinado', async () => {
  let { order } = E.O.createOrder(baseOrder(plan('romantico').id) as any);
  E.O.updateLetter(order, { pin: '4821' }); const l = E.O.getLetterByOrder(order.id)!;
  assert.notEqual(l.pin_hash, '4821'); assert.match(l.pin_hash, /^\$2[aby]\$/);
  assert.ok(E.O.verifyPin(l, '4821')); assert.ok(!E.O.verifyPin(l, '1234')); assert.ok(!E.O.verifyPin(l, ''));
  const ck = E.O.pinCookieValue(l.id); assert.ok(E.O.pinCookieValid(l.id, ck));
  assert.ok(!E.O.pinCookieValid(l.id + 1, ck)); assert.ok(!E.O.pinCookieValid(l.id, ck.slice(0, -2) + 'xx')); assert.ok(!E.O.pinCookieValid(l.id, undefined));
  const { letterPatchSchema } = await import('../src/lib/validation');
  assert.equal(letterPatchSchema.safeParse({ pin: '12' }).success, false); assert.equal(letterPatchSchema.safeParse({ pin: 'abcd' }).success, false); assert.equal(letterPatchSchema.safeParse({ pin: '123456' }).success, true);
});

test('12. Expiração automática e reativação', () => {
  let { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any);
  E.O.updateLetter(order, { mainMessage: 'Mensagem longa o bastante.' }); E.O.submitOrder(order);
  E.O.submitProof(E.O.getOrderById(order.id)!, PDF, ''); E.O.adminConfirmPayment(E.O.getOrderById(order.id)!); E.O.adminPublish(E.O.getOrderById(order.id)!);
  const token = E.O.getLetterByOrder(order.id)!.secure_token;
  assert.equal(E.O.resolvePublicLetter(token).state, 'ok');
  E.DB.run(`UPDATE letters SET expires_at = datetime('now', '-1 minute') WHERE order_id = ?`, order.id);
  assert.equal(E.O.resolvePublicLetter(token).state, 'expired'); // verificado no acesso, sem depender do job
  assert.equal(E.O.getOrderById(order.id)!.order_status, 'expired');
  E.O.adminSetExpiry(E.O.getOrderById(order.id)!, new Date(Date.now() + 5 * 864e5).toISOString());
  assert.equal(E.O.resolvePublicLetter(token).state, 'ok');
  E.DB.run(`UPDATE letters SET expires_at = datetime('now', '-1 minute') WHERE order_id = ?`, order.id);
  assert.ok(E.O.expireDue() >= 1); assert.equal(E.O.getOrderById(order.id)!.order_status, 'expired');
});

test('bloqueio pelo admin', () => {
  let { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any);
  E.O.updateLetter(order, { mainMessage: 'Mensagem longa o bastante.' }); E.O.submitOrder(order);
  E.O.submitProof(E.O.getOrderById(order.id)!, PDF, ''); E.O.adminConfirmPayment(E.O.getOrderById(order.id)!); E.O.adminPublish(E.O.getOrderById(order.id)!);
  const t = E.O.getLetterByOrder(order.id)!.secure_token;
  E.O.adminBlock(E.O.getOrderById(order.id)!, true); assert.equal(E.O.resolvePublicLetter(t).state, 'blocked');
  E.O.adminBlock(E.O.getOrderById(order.id)!, false); assert.equal(E.O.resolvePublicLetter(t).state, 'ok');
});

test('13. Eliminação remove encomenda, carta e ficheiros', async () => {
  const fs = await import('node:fs'); const path = await import('node:path');
  const { order } = E.O.createOrder(baseOrder(plan('premium').id) as any);
  const m = E.O.addMedia(order, 'photo', PNG, 'a.png'); const file = path.join(E.dir, 'uploads', m.storage_path); assert.ok(fs.existsSync(file));
  E.O.deleteOrderCompletely(order.id);
  assert.ok(!fs.existsSync(file)); assert.equal(E.O.getOrderById(order.id), undefined);
  assert.equal(E.DB.get('SELECT COUNT(*) n FROM media_assets WHERE letter_id = ?', m.letter_id)!.n, 0);
});

test('12b. Assinatura de URLs de media: válida, adulterada e expirada', () => {
  const ok = E.S.signedMediaUrl(7, 60); const u = new URL(ok, 'http://x'); const q = (k: string) => u.searchParams.get(k);
  assert.ok(E.S.verifyMediaSig(7, q('exp'), q('sig'))); assert.ok(!E.S.verifyMediaSig(8, q('exp'), q('sig')));
  assert.ok(!E.S.verifyMediaSig(7, String(Number(q('exp')) + 999), q('sig')));
  const old = new URL(E.S.signedMediaUrl(7, -10), 'http://x'); assert.ok(!E.S.verifyMediaSig(7, old.searchParams.get('exp'), old.searchParams.get('sig')));
});

test('segurança: sanitização, path traversal e rate limit', () => {
  assert.equal(E.S.cleanText('<script>alert(1)</script>Olá\u0000'), 'alert(1)Olá');
  assert.equal(E.S.cleanText('Amo-te <3 muito'), 'Amo-te <3 muito');
  assert.throws(() => E.ST.readFile('../../etc/passwd') ?? (() => { throw new Error('null'); })());
  E.S.resetRateLimits(); let last = { ok: true, retryAfter: 0 };
  for (let i = 0; i < 6; i++) last = E.S.rateLimit('t', 5, 1000); assert.equal(last.ok, false);
});

test('SQL injection: pesquisa do admin trata a entrada como texto', () => {
  E.O.createOrder(baseOrder(plan('essencial').id) as any);
  assert.doesNotThrow(() => E.O.listOrders({ q: "'; DROP TABLE orders; --" }));
  assert.ok(E.O.listOrders({}).length > 0);
  assert.equal(E.O.listOrders({ q: 'Bruno' }).length > 0, true);
  assert.equal(E.O.listOrders({ status: 'published' }).every(o => o.order_status === 'published'), true);
});

test('18. IA: mock só usa dados fornecidos e marca sugestões', async () => {
  const { runAi } = await import('../src/lib/ai');
  const r = await runAi({ action: 'generate_letter', recipientName: 'Ana Exemplo', senderName: 'Bruno', occasion: 'Amor', category: 'amor', extra: {}, tone: 'romantico', howMet: 'na faculdade', admire: 'a tua coragem', memories: [{ title: 'A viagem à praia', description: '' }], text: '', photoHint: '' });
  assert.match(r.text, /na faculdade/); assert.match(r.text, /a tua coragem/); assert.match(r.text, /\[Sugestão:/);
});

test('18b. IA indisponível: erro controlado (fluxo manual continua)', async () => {
  process.env.AI_PROVIDER = 'none'; const mod = await import('../src/lib/config'); (mod.config as any).aiProvider = 'none';
  const { runAi, AiUnavailableError, aiStatus } = await import('../src/lib/ai');
  assert.equal(aiStatus().available, false);
  await assert.rejects(runAi({ action: 'suggest_title', recipientName: '', senderName: '', occasion: '', category: 'amor', extra: {}, tone: 'simples', howMet: '', admire: '', memories: [], text: '', photoHint: '' }), AiUnavailableError);
});

test('10. QR Code PNG e SVG são gerados', async () => {
  const { qrPng, qrSvg } = await import('../src/lib/qr');
  const png = await qrPng('http://localhost:3000/carta/abc'); assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.match(await qrSvg('http://localhost:3000/carta/abc'), /^<svg/);
});

// ---------------- Fase 3: categorias, eventos, preços, RSVP ----------------
const evOrder = (planSlug = 'evento-basico', over: Record<string, unknown> = {}) => baseOrder(plan(planSlug).id, {
  occasion: 'convite-casamento', theme: 'gala', specialDate: '2099-06-19', title: 'Vamos celebrar', recipientName: 'Família e amigos',
  extra: { time: '16:00', venue: 'Salão Exemplo', rsvpDeadline: '2099-05-01' }, ...over,
});
const publishEvent = (o: any) => {
  E.O.updateLetter(o, { mainMessage: 'Estás convidado para o nosso grande dia.' }); E.O.submitOrder(o);
  let x = E.O.getOrderById(o.id)!; E.O.submitProof(x, PDF, 'r'); x = E.O.getOrderById(o.id)!; E.O.adminConfirmPayment(x); x = E.O.getOrderById(o.id)!; E.O.adminPublish(x);
  return E.O.getOrderById(o.id)!;
};

test('P1. Preços: mais barato 4 500; eventos mais caros que qualquer carta', () => {
  const cartas = E.O.listPlans(true, 'carta'), eventos = E.O.listPlans(true, 'evento');
  assert.equal(Math.min(...cartas.map(p => p.price)), 4500);
  assert.deepEqual(cartas.map(p => p.price), [4500, 8500, 14000]);
  assert.deepEqual(eventos.map(p => p.price), [25000, 45000, 80000]);
  assert.ok(Math.min(...eventos.map(p => p.price)) > Math.max(...cartas.map(p => p.price)));
  assert.deepEqual(eventos.map(p => p.max_guests), [100, 300, 1000]);
});

test('P2. Cada carta tem categoria própria, com campos e textos distintos', async () => {
  const { CATEGORIES } = await import('../src/lib/categories');
  assert.ok(CATEGORIES.filter(c => c.kind === 'carta').length >= 12); assert.ok(CATEGORIES.filter(c => c.kind === 'evento').length >= 4);
  assert.equal(new Set(CATEGORIES.map(c => c.slug)).size, CATEGORIES.length);
  assert.equal(new Set(CATEGORIES.map(c => c.kicker + '|' + c.message.label + '|' + c.aiHint)).size, CATEGORIES.length, 'sem categorias duplicadas');
  for (const c of CATEGORIES.filter(c => c.kind === 'carta' && !['outra', 'despedida'].includes(c.slug))) assert.ok(c.extra.length > 0 || c.proposal, c.slug + ' tem campos próprios');
  assert.equal(E.O.listOccasions().length >= 17, true);
});

test('P3. Extras da categoria: sanitização e ignorar campos alheios', async () => {
  const { sanitizeExtra } = await import('../src/lib/categories');
  const r = sanitizeExtra('convite-casamento', { time: '16:00', venue: '<script>alert(1)</script>Salão', mapUrl: 'javascript:alert(1)', hack: 'x', rsvpDeadline: 'amanhã' });
  assert.equal(r.time, '16:00'); assert.ok(!r.venue.includes('<')); assert.equal(r.mapUrl, undefined); assert.equal((r as any).hack, undefined); assert.equal(r.rsvpDeadline, undefined);
});

test('P4. Tipo do plano tem de corresponder à categoria', () => {
  assert.throws(() => E.O.createOrder(baseOrder(plan('evento-basico').id) as any), /plano de cartas/);
  assert.throws(() => E.O.createOrder(evOrder('romantico') as any), /pacotes de Eventos/);
  assert.throws(() => E.O.createOrder(evOrder('evento-basico', { extra: {} }) as any), /Falta preencher/);
  assert.throws(() => E.O.createOrder(evOrder('evento-basico', { specialDate: '' }) as any), /Falta preencher/);
  const { order } = E.O.createOrder(evOrder() as any); assert.equal(order.amount, 25000);
});

test('P5. RSVP: só com carta publicada, limites, prazo e deduplicação', () => {
  const { order } = E.O.createOrder(evOrder() as any); const pub = publishEvent(order); const letter = E.O.getLetterByOrder(pub.id)!;
  assert.equal(E.O.addRsvp(letter, pub, { name: 'João Silva', attending: 'yes', guests: 3, message: 'Vamos!' }).updated, false);
  assert.equal(E.O.addRsvp(letter, pub, { name: 'joão silva', attending: 'yes', guests: 2 }).updated, true, 'mesma pessoa atualiza');
  E.O.addRsvp(letter, pub, { name: 'Maria', attending: 'no', guests: 1 }); E.O.addRsvp(letter, pub, { name: 'Zé', attending: 'maybe', guests: 1 });
  assert.deepEqual(E.O.rsvpSummary(letter.id), { yes: 1, yesGuests: 2, no: 1, maybe: 1 });
  assert.equal(E.O.addRsvp(letter, pub, { name: 'Grande', attending: 'yes', guests: 99 }).updated, false);
  assert.ok(E.O.rsvpSummary(letter.id).yesGuests <= 12, 'máx. 10 pessoas por resposta');
  // limite do pacote
  E.DB.run('UPDATE plans SET max_guests = 4 WHERE id = ?', pub.plan_id);
  assert.throws(() => E.O.addRsvp(letter, pub, { name: 'Outro', attending: 'yes', guests: 5 }), /completa|lugares/);
  E.DB.run('UPDATE plans SET max_guests = 100 WHERE id = ?', pub.plan_id);
  // prazo
  E.DB.run(`UPDATE letters SET extra = ? WHERE id = ?`, JSON.stringify({ time: '16:00', venue: 'X', rsvpDeadline: '2000-01-01' }), letter.id);
  assert.throws(() => E.O.addRsvp(E.O.getLetterByOrder(pub.id)!, pub, { name: 'Tarde', attending: 'yes', guests: 1 }), /prazo/);
});

test('P6. RSVP: cartas normais não têm RSVP; CSV neutraliza fórmulas', () => {
  const { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any); const letter = E.O.getLetterByOrder(order.id)!;
  assert.throws(() => E.O.addRsvp(letter, order, { name: 'A', attending: 'yes', guests: 1 }), /não tem confirmação|encerradas/);
  const { order: ev } = E.O.createOrder(evOrder('evento-premium') as any); const pub = publishEvent(ev); const l = E.O.getLetterByOrder(pub.id)!;
  E.O.addRsvp(l, pub, { name: '=HYPERLINK("http://x")', attending: 'yes', guests: 1, message: '+cmd' });
  const csv = E.O.rsvpCsv(l.id); assert.ok(csv.includes(`"'=HYPERLINK`) && csv.includes(`"'+cmd"`));
});

test('P7. Pedido de namoro: resposta vem da configuração, nunca do cliente', async () => {
  const { order } = E.O.createOrder(baseOrder(plan('essencial').id, { occasion: 'pedido-namoro', theme: 'elegante' }) as any);
  const l = E.O.getLetterByOrder(order.id)!; assert.equal(l.allow_reply, 1);
  E.O.addReply(l, 'answer', 'Carla', 'Sim!'); const rep = E.O.listReplies(l.id); assert.equal(rep[0].kind, 'answer');
});

test('P8. Analytics: só contadores de eventos permitidos', () => {
  assert.equal(E.O.trackEvent('landing_view'), true); assert.equal(E.O.trackEvent('pricing_view'), true);
  assert.equal(E.O.trackEvent('<script>'), false); assert.equal(E.O.trackEvent('DROP TABLE'), false);
  const a = E.O.analyticsSummary(30); assert.ok(a.landing >= 1 && a.pricing >= 1);
  const cols = E.DB.all<{ name: string }>(`PRAGMA table_info(analytics_events)`).map(c => c.name); assert.deepEqual(cols.sort(), ['count', 'day', 'name']);
});

test('P9. Aberturas da carta são contadas', () => {
  const { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any); const l = E.O.getLetterByOrder(order.id)!;
  E.O.trackLetterView(l.id); E.O.trackLetterView(l.id); assert.equal(E.O.viewStats(l.id).total, 2);
});

test('P10. Trocar de ocasião para outro tipo exige plano compatível', () => {
  const { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any);
  assert.throws(() => E.O.changePlanOrOccasion(order, { occasion: 'convite-festa' }), /Eventos|plano/i);
  E.O.changePlanOrOccasion(order, { occasion: 'aniversario' }); assert.equal(E.O.getOrderById(order.id)!.occasion, 'aniversario');
});

test('N1. Rate limit persistente (sobrevive a "reinício" do estado em memória) e WhatsApp automático opcional', async () => {
  E.S.resetRateLimits();
  for (let i = 0; i < 3; i++) assert.equal(E.S.rateLimit('persist-test', 3, 60_000).ok, true);
  assert.equal(E.S.rateLimit('persist-test', 3, 60_000).ok, false);
  assert.ok(E.DB.get<{ count: number }>('SELECT count FROM rate_limits WHERE key = ?', 'persist-test')!.count >= 4, 'contador está na base de dados');
  const N = await import('../src/lib/notifications'); const { config } = await import('../src/lib/config');
  assert.equal(await N.notifyWhatsApp('+244923456789', 'x', 'olá'), false, 'sem credenciais não envia');
  config.waToken = 't'; config.waPhoneId = '123'; const realFetch = globalThis.fetch; let body: any = null;
  globalThis.fetch = (async (_u: any, init: any) => { body = JSON.parse(init.body); return new Response('{}', { status: 200 }); }) as any;
  try {
    assert.equal(await N.notifyWhatsApp('+244 923 456 789', 'published', 'Publicada'), true); assert.equal(body.to, '244923456789');
    const log = E.DB.all<any>('SELECT * FROM notification_log'); assert.equal(log.length, 1); assert.ok(!JSON.stringify(log).includes('923456789'), 'o número não fica no registo');
    globalThis.fetch = (async () => new Response('{}', { status: 500 })) as any; assert.equal(await N.notifyWhatsApp('244923456789', 'k', 't'), false, 'falha não lança erro');
  } finally { globalThis.fetch = realFetch; config.waToken = ''; config.waPhoneId = ''; }
});

// ---------------- Fase 4: newsletter, entrega agendada, cartão PDF ----------------
test('Q1. Newsletter: consentimento, dedupe, saída, CSV seguro', async () => {
  const N = await import('../src/lib/newsletter');
  assert.equal(N.subscribe('nao-e-email', 'popup').ok, false);
  assert.equal(N.subscribe('Ana@Exemplo.com ', 'popup').ok, true); assert.equal(N.subscribe('ana@exemplo.com', 'footer').ok, true);
  assert.equal(N.listSubscribers().filter(s => s.email === 'ana@exemplo.com').length, 1, 'sem duplicados (email em minúsculas)');
  assert.equal(N.subscribe('=cmd@x.com', 'popup').ok, false, 'fórmulas não passam como email');
  const s = N.listSubscribers().find(x => x.email === 'ana@exemplo.com')!; assert.ok(s.unsub_token.length >= 30);
  N.subscribe('bruno@exemplo.com', 'origem-inventada'); assert.equal(N.listSubscribers().find(x => x.email === 'bruno@exemplo.com')!.source, 'site');
  assert.equal(N.unsubscribe('token-invalido'), false); assert.equal(N.unsubscribe(s.unsub_token), true);
  assert.ok(!N.subscribersCsv().includes('ana@exemplo.com') && N.subscribersCsv().includes('bruno@exemplo.com'), 'CSV só com ativos');
  N.subscribe('ana@exemplo.com', 'home'); assert.ok(N.subscribersCsv().includes('ana@exemplo.com'), 'reinscrição reativa');
  assert.equal(N.subscriberStats().active, 2);
});

test('S1. Entrega agendada: fuso de Luanda, validação e carta bloqueada até à hora', async () => {
  const F = await import('../src/lib/format');
  assert.equal(F.luandaToUtc('2030-05-01T00:00'), '2030-04-30 23:00:00'); assert.equal(F.utcToLuanda('2030-04-30 23:00:00'), '2030-05-01T00:00');
  assert.equal(F.luandaToUtc('lixo'), null);
  let { order } = E.O.createOrder(baseOrder(plan('romantico').id) as any);
  assert.throws(() => E.O.updateLetter(order, { unlockAt: '2001-01-01T10:00' }), /futuro/);
  assert.throws(() => E.O.updateLetter(order, { unlockAt: '2099-01-01T10:00' }), /2 anos/);
  const inTwoHours = new Date(Date.now() + 2 * 3600_000 + 3600_000).toISOString().slice(0, 16); // hora de Luanda = UTC+1
  E.O.updateLetter(order, { mainMessage: 'Uma mensagem com mais de dez caracteres.', unlockAt: inTwoHours });
  E.O.submitOrder(order); order = E.O.getOrderById(order.id)!; E.O.submitProof(order, PDF, 'r'); order = E.O.getOrderById(order.id)!; E.O.adminConfirmPayment(order); E.O.adminPublish(E.O.getOrderById(order.id)!);
  const tok = E.O.getLetterByOrder(order.id)!.secure_token; const r = E.O.resolvePublicLetter(tok);
  assert.equal(r.state, 'locked'); assert.ok((r as any).unlockAt > new Date().toISOString());
  E.DB.run(`UPDATE letters SET unlock_at = datetime('now', '-1 minute') WHERE order_id = ?`, order.id);
  assert.equal(E.O.resolvePublicLetter(tok).state, 'ok', 'abre depois da hora');
  E.O.updateLetter(E.O.getOrderById(order.id)!, { unlockAt: '' }, 'admin'); assert.equal(E.O.getLetterByOrder(order.id)!.unlock_at, null);
});

test('C1. Cartão PDF: A6, pequeno e A4 são gerados (título com emojis não parte)', async () => {
  const { buildCardPdf } = await import('../src/lib/card');
  for (const s of ['a6', 'mini', 'a4'] as const) {
    const pdf = await buildCardPdf(s, { url: 'https://exemplo.ao/carta/abc', title: 'Para a Ana ♡ 🎂 — é hoje!', date: '14 de março de 2026', instruction: 'Lê o código para abrir o teu presente', kind: 'carta', reference: 'CQ-ABC123' });
    assert.equal(Buffer.from(pdf.slice(0, 5)).toString(), '%PDF-'); assert.ok(pdf.length > 5000, s);
  }
});

// ---------------- Fase 5: promoções com data de fim e códigos de desconto ----------------
test('D1. Promoção com data de fim: preço efetivo, expiração automática e amount da encomenda', () => {
  const p = plan('romantico'); assert.equal(p.promo_active, false); assert.equal(p.effective_price, p.price);
  E.DB.run(`UPDATE plans SET promo_price = 6000, promo_ends_at = datetime('now', '+5 days') WHERE id = ?`, p.id);
  let q = plan('romantico'); assert.equal(q.promo_active, true); assert.equal(q.effective_price, 6000); assert.equal(q.price, 8500, 'preço normal mantém-se');
  assert.equal(E.O.createOrder(baseOrder(q.id) as any).order.amount, 6000);
  E.DB.run(`UPDATE plans SET promo_ends_at = datetime('now', '-1 minute') WHERE id = ?`, p.id);
  q = plan('romantico'); assert.equal(q.promo_active, false); assert.equal(q.effective_price, 8500, 'volta ao preço normal sozinha'); assert.equal(q.promo_price, null);
  E.DB.run(`UPDATE plans SET promo_price = 9000, promo_ends_at = datetime('now', '+5 days') WHERE id = ?`, p.id);
  assert.equal(plan('romantico').promo_active, false, 'promo acima do preço normal é ignorada');
  E.DB.run('UPDATE plans SET promo_price = NULL, promo_ends_at = NULL WHERE id = ?', p.id);
});

test('D2. Códigos de desconto: validação, limites, piso de preço e contagem só ao confirmar pagamento', () => {
  const O = E.O;
  assert.throws(() => O.createDiscountCode({ code: 'x', kind: 'percent', value: 10, appliesTo: 'all' }), /3 a 24/);
  assert.throws(() => O.createDiscountCode({ code: 'BIG', kind: 'percent', value: 95, appliesTo: 'all' }), /90/);
  O.createDiscountCode({ code: ' bem-vindo10 ', kind: 'percent', value: 10, appliesTo: 'carta', maxUses: 1 });
  assert.throws(() => O.createDiscountCode({ code: 'BEM-VINDO10', kind: 'percent', value: 5, appliesTo: 'all' }), /Já existe/);
  O.createDiscountCode({ code: 'MENOS1000', kind: 'fixed', value: 1000, appliesTo: 'all' }); O.createDiscountCode({ code: 'EVENTOS', kind: 'percent', value: 20, appliesTo: 'evento' });
  O.createDiscountCode({ code: 'ENORME', kind: 'fixed', value: 99999, appliesTo: 'all' }); O.createDiscountCode({ code: 'VELHO', kind: 'percent', value: 10, appliesTo: 'all', validUntil: '2001-01-01T10:00' });
  assert.equal(O.hasActiveDiscountCodes(), true);
  let { order } = O.createOrder(baseOrder(plan('romantico').id) as any); assert.equal(order.amount, 8500);
  assert.throws(() => O.applyDiscount(order, 'nao-existe'), /inválido/); assert.throws(() => O.applyDiscount(order, 'VELHO'), /expirou/); assert.throws(() => O.applyDiscount(order, 'EVENTOS'), /Eventos/);
  O.applyDiscount(order, 'bem-vindo10'); order = O.getOrderById(order.id)!; assert.equal(order.amount, 7650); assert.equal(order.discount_amount, 850); assert.equal(order.discount_code, 'BEM-VINDO10');
  O.applyDiscount(order, 'MENOS1000'); assert.equal(O.getOrderById(order.id)!.amount, 7500, 'trocar de código substitui, não acumula');
  O.applyDiscount(order, 'ENORME'); assert.equal(O.getOrderById(order.id)!.amount, 500, 'nunca abaixo de 500 Kz');
  O.applyDiscount(order, 'BEM-VINDO10'); O.removeDiscount(O.getOrderById(order.id)!); assert.equal(O.getOrderById(order.id)!.amount, 8500);
  // mudar de plano recalcula
  O.applyDiscount(O.getOrderById(order.id)!, 'MENOS1000'); O.changePlanOrOccasion(O.getOrderById(order.id)!, { planId: plan('premium').id }); assert.equal(O.getOrderById(order.id)!.amount, 13000);
  O.changePlanOrOccasion(O.getOrderById(order.id)!, { planId: plan('essencial').id }); assert.equal(O.getOrderById(order.id)!.amount, 3500 < 500 ? 500 : 3500);
  // contagem só quando o admin confirma
  O.applyDiscount(O.getOrderById(order.id)!, 'BEM-VINDO10'); assert.equal(O.listDiscountCodes().find(c => c.code === 'BEM-VINDO10')!.used_count, 0);
  O.updateLetter(O.getOrderById(order.id)!, { mainMessage: 'Uma mensagem com mais de dez caracteres.' }); O.submitOrder(O.getOrderById(order.id)!); O.submitProof(O.getOrderById(order.id)!, PDF, 'r'); O.adminConfirmPayment(O.getOrderById(order.id)!);
  assert.equal(O.listDiscountCodes().find(c => c.code === 'BEM-VINDO10')!.used_count, 1);
  const { order: o2 } = O.createOrder(baseOrder(plan('romantico').id) as any); assert.throws(() => O.applyDiscount(o2, 'BEM-VINDO10'), /limite/);
  assert.throws(() => O.applyDiscount(O.getOrderById(order.id)!, 'MENOS1000'), /confirmada|editada/, 'não muda depois de confirmado');
});

test('D3. Códigos e promoções: não acumulam por defeito; oferta da newsletter', () => {
  const O = E.O; const p = plan('romantico');
  E.DB.run(`UPDATE plans SET promo_price = 7000, promo_ends_at = datetime('now', '+3 days') WHERE id = ?`, p.id);
  const { order } = O.createOrder(baseOrder(p.id) as any); assert.equal(order.amount, 7000);
  assert.throws(() => O.applyDiscount(order, 'MENOS1000'), /não é acumulável/);
  E.DB.run(`INSERT OR REPLACE INTO settings(key, value) VALUES('discount_stack_with_promo','1')`); O.applyDiscount(order, 'MENOS1000'); assert.equal(O.getOrderById(order.id)!.amount, 6000);
  E.DB.run(`INSERT OR REPLACE INTO settings(key, value) VALUES('discount_stack_with_promo','0')`); E.DB.run('UPDATE plans SET promo_price = NULL, promo_ends_at = NULL WHERE id = ?', p.id);
  assert.equal(O.newsletterOffer(), null);
  E.DB.run(`INSERT OR REPLACE INTO settings(key, value) VALUES('newsletter_code','MENOS1000')`); assert.deepEqual(O.newsletterOffer(), { code: 'MENOS1000', label: '1000 Kz de desconto' });
  E.DB.run('UPDATE discount_codes SET is_active = 0 WHERE code = ?', 'MENOS1000'); assert.equal(O.newsletterOffer(), null, 'código desativado não é oferecido');
  E.DB.run('UPDATE discount_codes SET is_active = 1 WHERE code = ?', 'MENOS1000');
});
