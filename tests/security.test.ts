// Testes das proteções de segurança (os 20 pontos da checklist).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { freshEnv, PNG, baseOrder } from './helpers';

let E: Awaited<ReturnType<typeof freshEnv>>;
before(async () => { E = await freshEnv(); });
const plan = (slug: string) => E.O.listPlans().find(p => p.slug === slug)!;

/** JPEG mínimo com EXIF que inclui orientação e coordenadas GPS (valores fora de linha). */
function jpegWithGps(): Buffer {
  const tiff = Buffer.alloc(120);
  tiff.write('II', 0, 'latin1'); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(2, 8); // IFD0 com 2 entradas
  tiff.writeUInt16LE(0x0112, 10); tiff.writeUInt16LE(3, 12); tiff.writeUInt32LE(1, 14); tiff.writeUInt16LE(6, 18); // Orientation = 6
  tiff.writeUInt16LE(0x8825, 22); tiff.writeUInt16LE(4, 24); tiff.writeUInt32LE(1, 26); tiff.writeUInt32LE(38, 30); // GPS IFD em 38
  tiff.writeUInt32LE(0, 34);
  tiff.writeUInt16LE(1, 38); // GPS IFD com 1 entrada: latitude (3 racionais = 24 bytes em 60)
  tiff.writeUInt16LE(0x0002, 40); tiff.writeUInt16LE(5, 42); tiff.writeUInt32LE(3, 44); tiff.writeUInt32LE(60, 48);
  for (let i = 0; i < 6; i++) tiff.writeUInt32LE(0xdeadbeef, 60 + i * 4); // "coordenadas"
  const exif = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), Buffer.from([0, 0]), exif]); app1.writeUInt16BE(exif.length + 2, 2);
  const xmpBody = Buffer.from('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>GPSLatitude=-8.8</x:xmpmeta>', 'latin1');
  const xmp = Buffer.concat([Buffer.from([0xff, 0xe1, 0, 0]), xmpBody]); xmp.writeUInt16BE(xmpBody.length + 2, 2);
  const com = Buffer.from([0xff, 0xfe, 0, 7, 0x68, 0x6f, 0x6d, 0x65, 0x21]);
  const app0 = Buffer.from([0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, app1, xmp, com, Buffer.from([0xff, 0xda, 0, 2]), Buffer.alloc(300, 7), Buffer.from([0xff, 0xd9])]);
}

test('S1. Segredos: o valor de exemplo nunca é usado em produção', async () => {
  const sec = await import('../src/lib/secrets');
  const prev = { NODE_ENV: process.env.NODE_ENV, SESSION_SECRET: process.env.SESSION_SECRET };
  try {
    Object.assign(process.env, { NODE_ENV: 'production', SESSION_SECRET: 'troca-por-uma-string-aleatoria-com-32+-caracteres' });
    sec.resetSecretCache();
    const s = sec.sessionSecret();
    assert.notEqual(s, process.env.SESSION_SECRET); assert.ok(s.length >= 43);
    assert.ok(fs.existsSync(path.join(E.dir, '.session-secret')));
    assert.equal((fs.statSync(path.join(E.dir, '.session-secret')).mode & 0o777), 0o600);
  } finally { Object.assign(process.env, prev); sec.resetSecretCache(); }
  assert.ok(sec.isExamplePassword('troca-esta-password')); assert.ok(!sec.isExamplePassword('Uma-password-forte-2026'));
});

test('S5. Email e telefone cifrados na base de dados; ficheiros cifrados no disco', () => {
  const { order } = E.O.createOrder(baseOrder(plan('romantico').id, { contact: 'cliente@exemplo.ao' }) as any);
  const raw = E.DB.get<{ customer_email: string; customer_email_idx: string }>('SELECT customer_email, customer_email_idx FROM orders WHERE id = ?', order.id)!;
  assert.match(raw.customer_email, /^enc:v1:/); assert.ok(!raw.customer_email.includes('cliente'));
  assert.equal(order.customer_email, 'cliente@exemplo.ao'); // decifrado para o servidor
  assert.equal(E.O.listOrders({ q: 'cliente@exemplo.ao' }).filter(o => o.id === order.id).length, 1); // pesquisa por índice cego
  const m = E.O.addMedia(order, 'photo', PNG, 'f.png');
  const onDisk = fs.readFileSync(path.join(E.dir, 'uploads', m.storage_path));
  assert.equal(onDisk.subarray(0, 4).toString(), 'CQE1'); assert.ok(!onDisk.includes(PNG.subarray(0, 8)));
  assert.deepEqual(E.ST.readFile(m.storage_path), PNG);
  assert.equal(E.S.decryptText(E.S.encryptText('olá')), 'olá'); assert.equal(E.S.decryptText('texto antigo'), 'texto antigo');
  const tampered = E.S.encryptText('segredo')!.slice(0, -4) + 'AAAA'; assert.equal(E.S.decryptText(tampered), null);
});

test('S16. Uploads: localização GPS removida das fotografias (mantém a orientação)', () => {
  const { order } = E.O.createOrder(baseOrder(plan('romantico').id) as any);
  const src = jpegWithGps();
  assert.ok(src.includes(Buffer.from([0xef, 0xbe, 0xad, 0xde])));
  const m = E.O.addMedia(order, 'photo', src, 'gps.jpg');
  const saved = E.ST.readFile(m.storage_path)!;
  assert.ok(!saved.includes(Buffer.from([0xef, 0xbe, 0xad, 0xde])), 'coordenadas apagadas');
  assert.ok(!saved.includes(Buffer.from('GPSLatitude')), 'XMP removido');
  assert.ok(!saved.includes(Buffer.from('home!')), 'comentário removido');
  assert.ok(saved.includes(Buffer.from([0x12, 0x01, 0x03, 0x00])), 'orientação mantida');
  assert.equal(saved[0], 0xff); assert.equal(saved[1], 0xd8);
});

test('S12. Proteção contra robôs: token assinado, tempo mínimo e campo-armadilha', () => {
  const t = E.S.newFormToken(); const now = Date.now();
  assert.deepEqual(E.S.checkBot({ _t: t }, now + 3000), { ok: true });
  assert.equal(E.S.checkBot({ _t: t }, now + 500).ok, false); // rápido demais
  assert.equal(E.S.checkBot({ _t: t, website: 'spam' }, now + 3000).ok, false); // armadilha preenchida
  assert.equal(E.S.checkBot({}, now + 3000).ok, false); // sem token
  assert.equal(E.S.checkBot({ _t: t.slice(0, -3) + 'abc' }, now + 3000).ok, false); // token forjado
  assert.equal(E.S.checkBot({ _t: t }, now + 13 * 3600_000).ok, false); // expirado
});

test('S11. IP real para limites de taxa: X-Forwarded-For falsificado não engana', () => {
  const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 9.9.9.9' }); // 1.2.3.4 foi inventado pelo cliente; 9.9.9.9 foi posto pelo proxy
  assert.equal(E.S.ipFromHeaders(h), '9.9.9.9');
  for (let i = 0; i < 8; i++) E.S.rateLimit('login:9.9.9.9', 8, 60_000);
  assert.equal(E.S.rateLimit('login:9.9.9.9', 8, 60_000).ok, false);
});

test('S14. Pedidos: tamanho limitado e só JSON verdadeiro', async () => {
  const big = new Request('http://x/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'x'.repeat(70_000) }) });
  await assert.rejects(E.S.readJson(big), E.S.BodyTooLarge);
  const form = new Request('http://x/', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{"a":1}' });
  assert.equal(await E.S.readJson(form), null); // formulário de outro site (text/plain) é ignorado
  const okReq = new Request('http://x/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"a":1}' });
  assert.deepEqual(await E.S.readJson(okReq), { a: 1 });
});

test('S13. SQL dinâmico só com colunas da lista permitida', () => {
  assert.throws(() => E.S.assertIdentifiers(['title; DROP TABLE orders'], ['title']));
  assert.doesNotThrow(() => E.S.assertIdentifiers(['title'], ['title']));
  const { order } = E.O.createOrder(baseOrder(plan('essencial').id) as any);
  E.O.updateLetter(order, { title: "'); DROP TABLE orders; --" });
  assert.ok(E.DB.get('SELECT COUNT(*) n FROM orders')); // tabela intacta
});

test('S8. Campos protegidos não podem ser alterados pelo cliente', async () => {
  const { createOrderSchema, letterPatchSchema } = await import('../src/lib/validation');
  const p = createOrderSchema.parse({ ...baseOrder(plan('essencial').id), amount: 1, order_status: 'published', payment_status: 'confirmed' });
  assert.ok(!('amount' in p) && !('order_status' in p) && !('payment_status' in p));
  const l = letterPatchSchema.parse({ title: 'x', is_published: 1, secure_token: 'meu', expires_at: '2099-01-01' });
  assert.deepEqual(Object.keys(l), ['title']);
  const { order } = E.O.createOrder(p as any);
  assert.equal(order.amount, plan('essencial').price); assert.equal(order.order_status, 'draft');
});
