const { chromium, devices } = require('playwright-core');
const jsQR = require('jsqr'); const { PNG } = require('pngjs'); const fs = require('fs');
const BASE = 'http://localhost:3111';
const step = (m) => console.log('•', m);
const assert = (c, m) => { if (!c) { throw new Error('FALHOU: ' + m); } console.log('  ✓', m); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }).catch(async () => chromium.launch({ args: ['--no-sandbox'] }));
  const phone = devices['Pixel 5'];
  const ctx = await browser.newContext({ ...phone, locale: 'pt-AO' });
  await ctx.addInitScript(() => { try { localStorage.setItem('cq_nl', JSON.stringify({ t: Date.now(), s: 0 })); } catch {} });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());

  step('1. Landing no telemóvel');
  await page.goto(BASE); await page.screenshot({ path: 'shot-landing.png' });
  assert(await page.locator('h1').innerText() === 'Cria uma surpresa que vai ser lembrada para sempre.', 'título do hero');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, 'sem scroll horizontal (overflow=' + overflow + ')');
  await page.screenshot({ path: 'shot-landing-full.png', fullPage: true });

  step('2. Ver exemplo e abrir a carta');
  await page.getByRole('link', { name: 'Ver exemplos' }).click(); await page.locator('#exemplos a').first().click();
  await page.waitForURL(/exemplos\//); await page.getByRole('button', { name: /^Abrir (a minha carta|o meu presente|o convite)/ }).click();
  await page.waitForSelector('main section h2'); await page.screenshot({ path: 'shot-demo.png' });
  assert(await page.locator('text=Exemplo fictício').count() > 0, 'aviso de exemplo fictício');

  step('3. Wizard: ocasião e plano');
  await page.goto(BASE + '/criar');
  await page.locator('label:has-text("Aniversário")').first().click(); await page.getByRole('button', { name: 'Continuar' }).click();
  await page.locator('label:has-text("Romântico")').first().click();
  await page.screenshot({ path: 'shot-plano.png' });
  await page.getByRole('button', { name: 'Continuar' }).click();

  step('4. Informações (validação e preenchimento)');
  await page.getByRole('button', { name: 'Continuar' }).click();
  assert(await page.locator('text=Preenche: nome do(a) aniversariante.').count() === 1, 'erro de campo obrigatório');
  await page.getByLabel('Nome do(a) aniversariante').fill('Ana Exemplo'); await page.getByLabel('Nome de quem oferece').fill('Bruno Exemplo');
  await page.getByLabel('Título da experiência').fill('Para a minha pessoa favorita'); await page.getByLabel('Data do aniversário').fill('2026-09-27');
  await page.getByLabel('O teu email ou WhatsApp').fill('abc'); await page.getByRole('button', { name: 'Continuar' }).click();
  assert(await page.locator('text=Indica um email válido ou um telefone').count() === 1, 'contacto inválido rejeitado');
  await page.getByLabel('O teu email ou WhatsApp').fill('923 456 789'); await page.locator('label:has-text("Elegante")').first().click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  step('5. Mensagem + IA (rascunho editável)');
  await page.getByLabel('Como começou a vossa amizade ou relação?').fill('Conhecemo-nos numa festa de amigos.');
  await page.locator('#m-t-0').fill('A viagem à praia'); await page.locator('#m-d-0').fill('O carro avariou e rimos o caminho todo.');
  await page.getByLabel('O que mais admiras nessa pessoa?').fill('A tua alegria e a tua coragem.');
  await page.getByRole('button', { name: /Ajudar-me a escrever com IA/ }).click();
  await page.waitForSelector('#draft'); const draft = await page.locator('#draft').inputValue();
  assert(draft.includes('festa de amigos') && draft.includes('[Sugestão:'), 'rascunho usa só os dados e marca sugestões');
  assert(await page.locator('#main').inputValue() === '', 'IA não publica nem preenche automaticamente');
  await page.locator('#draft').fill(draft + '\n\nEditado por mim.'); await page.getByRole('button', { name: 'Usar este texto' }).click();
  assert((await page.locator('#main').inputValue()).includes('Editado por mim.'), 'texto editado passa para a mensagem');
  await page.getByLabel('Frase final').fill('Parabéns, meu amor!'); await page.getByRole('button', { name: 'Continuar' }).click();

  step('6. Uploads: válido, inválido, remover');
  await page.waitForSelector('#in-photos');
  await page.setInputFiles('#in-cover', '' + __dirname + '/photo0.jpg'); await page.waitForSelector('img[alt="Imagem de capa escolhida"]');
  await page.setInputFiles('#in-photos', ['' + __dirname + '/photo1.jpg', '' + __dirname + '/photo2.jpg']); await page.waitForSelector('text=(2/15)');
  await page.setInputFiles('#in-photos', '' + __dirname + '/notimage.jpg'); await page.waitForSelector('text=Tipo de ficheiro não permitido');
  assert(true, 'ficheiro executável rejeitado com mensagem clara');
  await page.screenshot({ path: 'shot-upload.png' });
  await page.getByRole('button', { name: 'Remover', exact: true }).first().click(); await page.waitForSelector('text=(1/15)'); assert(true, 'remover ficheiro funciona');
  await page.setInputFiles('#in-photos', '' + __dirname + '/photo2.jpg'); await page.waitForSelector('text=(2/15)');
  await page.getByRole('button', { name: 'Continuar' }).click();

  step('7. Música/ambiente e pré-visualização');
  await page.locator('label:has-text("Ambiente sonoro simples")').click(); await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForSelector('text=Vê como vai ficar'); await page.screenshot({ path: 'shot-preview.png', fullPage: true });
  await page.getByLabel('Título', { exact: true }).fill('Para a minha pessoa favorita ♡');
  await page.getByRole('button', { name: /Subir fotografia 2/ }).click(); await page.waitForTimeout(500);
  await page.getByLabel('PIN de proteção (opcional)').fill('4821');
  await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();

  step('8. Pagamento manual');
  await page.waitForSelector('text=Como pagar'); await page.screenshot({ path: 'shot-pagamento.png', fullPage: true });
  const ref = (await page.locator('strong', { hasText: /^CQ-/ }).first().innerText());
  assert(/^CQ-[A-Z2-9]{6}$/.test(ref), 'código da encomenda ' + ref);
  await page.getByRole('button', { name: 'Enviar comprovativo' }).click();
  assert(await page.locator('text=Anexa o comprovativo de pagamento').count() === 1, 'bloqueia envio sem comprovativo');
  await page.setInputFiles('#proof', '' + __dirname + '/proof.png'); await page.getByLabel('Referência ou observação (opcional)').fill('Transferência BAI');
  await page.getByRole('button', { name: 'Enviar comprovativo' }).click();
  await page.waitForSelector('text=Recebemos o teu pedido.'); assert(await page.locator('text=A nossa equipa irá confirmar o pagamento e desbloquear a tua Carta QR.').count() === 1, 'mensagem de confirmação');
  await page.screenshot({ path: 'shot-recebido.png' });
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('cq_wizard_v1')).token);
  await page.goto(BASE + '/minha/' + token); assert(await page.locator('text=Comprovativo enviado').count() > 0, 'estado proof_submitted (não confirmado)');
  assert(await page.locator('text=O teu QR Code').count() === 0, 'QR ainda não disponível');

  step('9. Admin: login, comprovativo, confirmar, publicar');
  const actx = await browser.newContext({ ...devices['Desktop Chrome'] }); const admin = await actx.newPage(); admin.on('dialog', d => d.accept());
  await admin.goto(BASE + '/admin'); assert(admin.url().includes('/admin/login'), 'redireciona para login sem sessão');
  await admin.getByLabel('Email').fill('admin@test.local'); await admin.getByLabel('Password').fill('errada'); await admin.getByRole('button', { name: 'Entrar' }).click();
  await admin.waitForSelector('text=Email ou password incorretos.'); assert(true, 'password errada rejeitada');
  await admin.getByLabel('Password').fill('Password#12345'); await admin.getByRole('button', { name: 'Entrar' }).click(); await admin.waitForSelector('text=Receita confirmada');
  await admin.getByPlaceholder('Pesquisar por nome, telefone, email ou código').fill('923456789'); await admin.getByRole('button', { name: 'Filtrar' }).click();
  await admin.getByRole('link', { name: ref }).click(); await admin.waitForSelector('text=Comprovativo de pagamento');
  assert(await admin.locator('img[alt="Comprovativo enviado pelo cliente"]').count() === 1, 'admin vê o comprovativo');
  assert(await admin.locator('button:has-text("Publicar carta")').count() === 0, 'publicar indisponível antes de confirmar');
  await admin.screenshot({ path: 'shot-admin-order.png', fullPage: true });
  await admin.getByRole('button', { name: 'Confirmar pagamento' }).click(); await admin.waitForSelector('text=Pagamento confirmado.');
  await admin.getByRole('button', { name: 'Publicar carta' }).click(); await admin.waitForSelector('text=Carta publicada.');
  assert(await admin.locator('text=Publicada').count() > 0, 'estado publicada');
  await admin.goto(BASE + '/admin/settings'); assert(await admin.locator('#whatsapp_number').count() === 1, 'configurações acessíveis'); await admin.screenshot({ path: 'shot-admin-settings.png' });

  step('10. Cliente: QR Code, download e leitura');
  await page.goto(BASE + '/minha/' + token); await page.waitForSelector('text=O teu QR Code'); await page.waitForSelector('img[alt^="QR Code"]');
  await page.screenshot({ path: 'shot-qr.png', fullPage: true });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Descarregar PNG' }).click()]);
  await dl.saveAs('' + __dirname + '/qr.png'); const png = PNG.sync.read(fs.readFileSync('' + __dirname + '/qr.png'));
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height); assert(code && code.data.startsWith(BASE + '/carta/'), 'QR descodificado: ' + (code && code.data.slice(0, 50)) + '…');
  const link = code.data;

  step('11. Destinatário abre o link do QR (outro telemóvel, com PIN)');
  const rctx = await browser.newContext({ ...devices['iPhone 12'], locale: 'pt-PT' }); const rp = await rctx.newPage(); const rerr = []; rp.on('pageerror', e => rerr.push(e.message));
  await rp.goto(link); await rp.waitForSelector('text=Esta carta está protegida');
  await rp.getByLabel('PIN').fill('0000'); await rp.getByRole('button', { name: 'Abrir carta' }).click(); await rp.waitForSelector('text=PIN incorreto'); assert(true, 'PIN incorreto');
  await rp.getByLabel('PIN').fill('4821'); await rp.getByRole('button', { name: 'Abrir carta' }).click();
  await rp.getByRole('button', { name: /^Abrir (a minha carta|o meu presente|o convite)/ }).click(); await rp.waitForSelector('text=Editado por mim.');
  await rp.waitForTimeout(800); await rp.screenshot({ path: 'shot-carta.png', fullPage: true });
  const imgs = await rp.evaluate(() => Array.from(document.images).map(i => ({ ok: i.complete && i.naturalWidth > 0, src: i.src.slice(0, 40) })));
  assert(imgs.length >= 3 && imgs.every(i => i.ok), 'imagens da carta carregam (' + imgs.length + ')');
  assert(await rp.locator('text=Criado com Carta QR').count() === 1, 'assinatura Criado com Carta QR');
  await rp.getByRole('button', { name: /Ouvir: Piano suave/ }).click(); await rp.waitForTimeout(500); assert(await rp.getByRole('button', { name: /Pausar ambiente/ }).count() === 1, 'ambiente sonoro só inicia após toque');
  const html = await rp.content(); assert(!html.includes('923456789') && !html.includes('+244923') && !html.includes(ref), 'sem dados do comprador na carta pública');
  assert((await rp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'sem scroll horizontal na carta');
  assert(rerr.length === 0, 'sem erros JS na carta ' + rerr.join('|'));

  console.log(errors.length ? '\nAvisos de consola:\n' + errors.join('\n') : '\nSem erros de consola no fluxo do cliente.');
  await browser.close(); console.log('\nJORNADA COMPLETA OK');
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
