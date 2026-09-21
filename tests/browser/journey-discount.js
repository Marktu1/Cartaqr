// Jornada 4: promoção com data de fim + códigos de desconto (admin → preços → wizard → pop-up). Servidor em :3111 com BD limpa.
const { chromium, devices } = require('playwright-core');
const BASE = 'http://localhost:3111';
const step = m => console.log('•', m);
const assert = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('  ✓', m); };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const errs = [];
  step('1. Admin: configurar promoção e código');
  const a = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); a.on('pageerror', e => errs.push(e.message));
  await a.goto(BASE + '/admin/login'); await a.getByLabel('Email').fill('admin@test.local'); await a.getByLabel('Password').fill('Password#12345'); await a.getByRole('button', { name: 'Entrar' }).click(); await a.waitForSelector('text=Receita confirmada');
  await a.goto(BASE + '/admin/settings');
  const form = a.locator('form:has(input[name="name"][value="Essencial"])');
  const orig = await form.locator('input[name="price"]').inputValue();
  // preço promocional >= normal → erro
  await form.locator('input[name="promo_price"]').fill(String(Number(orig) + 100)); await form.locator('input[name="promo_ends_at"]').fill('2099-01-01T10:00'); await form.getByRole('button', { name: /Guardar plano/ }).click();
  await a.waitForSelector('text=/Erro/'); assert(true, 'promoção acima do preço normal é recusada');
  const end = new Date(Date.now() + 7 * 864e5 + 3600e3).toISOString().slice(0, 16);
  await a.goto(BASE + '/admin/settings'); const f2 = a.locator('form:has(input[name="name"][value="Essencial"])');
  await f2.locator('input[name="promo_price"]').fill('3900'); await f2.locator('input[name="promo_ends_at"]').fill(end); await f2.getByRole('button', { name: /Guardar plano/ }).click();
  await a.waitForSelector('text=ATIVA'); assert(true, 'promoção guardada e marcada como ATIVA');
  await a.locator('legend:has-text("ATIVA")').scrollIntoViewIfNeeded(); await a.screenshot({ path: 'shot-admin-promo.png' });
  await a.locator('#dc-code').fill('bemvindo10'); await a.locator('#dc-val').fill('10'); await a.locator('#dc-max').fill('50'); await a.getByRole('button', { name: 'Criar código' }).click();
  await a.waitForSelector('td:has-text("BEMVINDO10")'); assert(true, 'código criado');
  await a.locator('#nl-code').selectOption('BEMVINDO10'); await a.getByRole('button', { name: 'Guardar opções de desconto' }).click(); await a.waitForTimeout(800);
  await a.goto(BASE + '/admin/settings#descontos'); await a.locator('#descontos').scrollIntoViewIfNeeded(); await a.screenshot({ path: 'shot-admin-descontos.png' });
  assert(await a.locator('#nl-code').inputValue() === 'BEMVINDO10', 'código da newsletter guardado');
  assert(await a.locator('form:has(input[name="name"][value="Essencial"]) input[name="price"]').inputValue() === orig, 'guardar opções não altera preços');

  step('2. Preços: promoção real, com data de fim');
  const m = await (await browser.newContext({ ...devices['Pixel 5'] })).newPage(); m.on('pageerror', e => errs.push(e.message));
  await m.goto(BASE + '/precos'); const t = await m.locator('body').innerText();
  assert(/Preço promocional até/.test(t) && /3\s900/.test(t), 'mostra preço promocional e data de fim'); await m.screenshot({ path: 'shot-precos-promo.png', fullPage: true });
  assert((await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, 'sem scroll horizontal');

  step('3. Wizard: código no pagamento (com promoção ativa não acumula)');
  await m.goto(BASE + '/criar'); await m.locator('label:has-text("Aniversário")').first().click(); await m.getByRole('button', { name: 'Continuar' }).click();
  await m.locator('label:has-text("Essencial")').first().click(); await m.getByRole('button', { name: 'Continuar' }).click();
  await m.getByLabel('Nome do(a) aniversariante').fill('Ana Exemplo'); await m.getByLabel('Nome de quem oferece').fill('Bruno Exemplo'); await m.getByLabel('Título da experiência').fill('Para a minha pessoa favorita'); await m.getByLabel('Data do aniversário').fill('2026-12-27');
  await m.getByLabel('O teu email ou WhatsApp').fill('923 456 789'); await m.getByRole('button', { name: 'Continuar' }).click();
  await m.getByLabel('Como começou a vossa amizade ou relação?').fill('Conhecemo-nos numa festa.'); await m.getByLabel('O que mais admiras nessa pessoa?').fill('A tua alegria.'); await m.locator('#main').fill('Uma mensagem sincera para ti.'); await m.getByLabel('Frase final').fill('Parabéns!'); await m.getByRole('button', { name: 'Continuar' }).click();
  await m.waitForSelector('#in-photos'); await m.getByRole('button', { name: 'Continuar' }).click();
  await m.getByRole('button', { name: 'Continuar' }).click(); await m.waitForSelector('text=Vê como vai ficar');
  await m.getByRole('button', { name: 'Continuar para o pagamento' }).click(); await m.waitForSelector('text=Como pagar');
  await m.waitForSelector('#dcode'); await m.locator('#dcode').fill('NAOEXISTE'); await m.getByRole('button', { name: /Aplicar/ }).click(); await m.waitForSelector('[role=alert]:has-text("código")'); assert(true, 'código inválido mostra erro claro');
  await m.locator('#dcode').fill('bemvindo10'); await m.getByRole('button', { name: /Aplicar/ }).click(); await m.waitForTimeout(800);
  const total1 = await m.locator('[data-testid=order-total]').innerText(); console.log('   total com promoção ativa:', total1.replace(/\s+/g, ' '));
  await m.screenshot({ path: 'shot-pagamento-promo.png' });
  assert(/3\s900/.test(total1), 'com promoção ativa o código não acumula (total 3 900 Kz)');

  step('4. Sem promoção: o código aplica-se');
  await a.goto(BASE + '/admin/settings'); const f3 = a.locator('form:has(input[name="name"][value="Essencial"])'); await f3.locator('input[name="promo_price"]').fill(''); await f3.getByRole('button', { name: /Guardar plano/ }).click(); await a.waitForTimeout(800);
  await a.goto(BASE + '/admin/settings'); assert(await a.locator('legend:has-text("ATIVA")').count() === 0, 'promoção removida');
  const m2 = await (await browser.newContext({ ...devices['Pixel 5'] })).newPage();
  await m2.goto(BASE + '/precos'); assert(!/Preço promocional até/.test(await m2.locator('body').innerText()), 'sem promoção não aparece riscado');
  await m2.goto(BASE + '/criar'); await m2.locator('label:has-text("Aniversário")').first().click(); await m2.getByRole('button', { name: 'Continuar' }).click();
  await m2.locator('label:has-text("Essencial")').first().click(); await m2.getByRole('button', { name: 'Continuar' }).click();
  await m2.getByLabel('Nome do(a) aniversariante').fill('Ana Exemplo'); await m2.getByLabel('Nome de quem oferece').fill('Bruno Exemplo'); await m2.getByLabel('Título da experiência').fill('Para a minha pessoa favorita'); await m2.getByLabel('Data do aniversário').fill('2026-12-27');
  await m2.getByLabel('O teu email ou WhatsApp').fill('923 456 789'); await m2.getByRole('button', { name: 'Continuar' }).click();
  await m2.getByLabel('Como começou a vossa amizade ou relação?').fill('Conhecemo-nos numa festa.'); await m2.getByLabel('O que mais admiras nessa pessoa?').fill('A tua alegria.'); await m2.locator('#main').fill('Uma mensagem sincera para ti.'); await m2.getByLabel('Frase final').fill('Parabéns!'); await m2.getByRole('button', { name: 'Continuar' }).click();
  await m2.waitForSelector('#in-photos'); await m2.getByRole('button', { name: 'Continuar' }).click(); await m2.getByRole('button', { name: 'Continuar' }).click(); await m2.waitForSelector('text=Vê como vai ficar');
  await m2.getByRole('button', { name: 'Continuar para o pagamento' }).click(); await m2.waitForSelector('#dcode');
  await m2.locator('#dcode').fill('bemvindo10'); await m2.getByRole('button', { name: /Aplicar/ }).click(); await m2.waitForSelector('text=/BEMVINDO10/');
  const total2 = (await m2.locator('[data-testid=order-total]').innerText()).replace(/\s+/g, ' '); console.log('   total com código:', total2);
  assert(/4\s050/.test(total2), 'código de 10 % sobre 4 500 → 4 050 Kz'); await m2.screenshot({ path: 'shot-pagamento-codigo.png', fullPage: true });
  await m2.getByRole('button', { name: 'Remover' }).click(); await m2.waitForTimeout(600); assert(/4\s500/.test(await m2.locator('[data-testid=order-total]').innerText()), 'remover o código repõe 4 500 Kz');

  step('5. Pop-up da newsletter mostra o código');
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6)); await p.waitForSelector('[role=dialog]');
  await p.locator('[role=dialog] input[type=email]').fill('desconto@exemplo.com'); await p.locator('[role=dialog] input[type=checkbox]').check(); await p.locator('[role=dialog] button:has-text("Quero receber")').click();
  await p.waitForSelector('[role=dialog] [role=status]'); await p.waitForTimeout(600); assert((await p.locator('[role=dialog]').innerText()).includes('BEMVINDO10'), 'código aparece após a inscrição'); await p.screenshot({ path: 'shot-popup-codigo.png' });
  assert(errs.length === 0, 'sem erros JS ' + errs.join('|'));
  await browser.close(); console.log('\nJORNADA DE DESCONTOS OK');
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
