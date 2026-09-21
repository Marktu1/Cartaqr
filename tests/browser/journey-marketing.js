// Jornada 3: pop-up/newsletter, entrega agendada e cartão imprimível. Requer `PREP` (saída de prep-marketing.ts) e servidor em :3111.
const { chromium, devices } = require('playwright-core');
const { execSync } = require('child_process'); const fs = require('fs');
const BASE = 'http://localhost:3111';
const step = m => console.log('•', m);
const assert = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('  ✓', m); };
const PREP = JSON.parse(process.env.PREP || '{}');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  step('1. Pop-up de newsletter (desktop): aparece, valida, inscreve e não volta');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(500); assert(await p.locator('[role=dialog]').count() === 0, 'não aparece logo à entrada');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6)); await p.waitForSelector('[role=dialog]');
  assert(await p.locator('#nl-title').innerText() === 'Ideias para surpreender quem amas', 'pop-up visível após scroll'); await p.waitForTimeout(700); await p.screenshot({ path: 'shot-popup-newsletter.png' });
  await p.locator('[role=dialog] input[type=email]').fill('marcos@exemplo.com'); await p.locator('[role=dialog] button:has-text("Quero receber")').click();
  assert(await p.locator('[role=dialog] [role=alert]').count() === 1, 'exige consentimento');
  await p.locator('[role=dialog] input[type=checkbox]').check(); await p.locator('[role=dialog] button:has-text("Quero receber")').click();
  await p.waitForSelector('[role=dialog] [role=status]'); assert(true, 'inscrição confirmada'); await p.screenshot({ path: 'shot-popup-ok.png' });
  await p.getByRole('button', { name: 'Fechar' }).click(); await p.waitForSelector('[role=dialog]', { state: 'detached' }); assert(true, 'pop-up fica visível (para mostrar o código) e fecha no botão');
  await p.reload(); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6)); await p.waitForTimeout(1500); assert(await p.locator('[role=dialog]').count() === 0, 'não volta a aparecer a quem já se inscreveu');
  const ctx2 = await browser.newContext({ ...devices['Pixel 5'] }); const m = await ctx2.newPage(); await m.goto(BASE); await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6)); await m.waitForSelector('[role=dialog]');
  assert((await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'pop-up cabe no telemóvel'); await m.waitForTimeout(600); await m.screenshot({ path: 'shot-popup-mobile.png' });
  await m.keyboard.press('Escape'); assert(await m.locator('[role=dialog]').count() === 0, 'Esc fecha o pop-up'); await m.reload(); await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6)); await m.waitForTimeout(1500);
  assert(await m.locator('[role=dialog]').count() === 0, 'depois de fechar não insiste (14 dias)');
  await m.locator('footer').scrollIntoViewIfNeeded(); await m.locator('#nl-footer').fill('rodape@exemplo.com'); await m.locator('footer input[type=checkbox]').check(); await m.locator('footer button:has-text("Quero receber")').click(); await m.waitForSelector('footer [role=status]'); assert(true, 'formulário do rodapé funciona');
  await p.goto(BASE + '/exemplos/pessoa-favorita'); await p.evaluate(() => window.scrollTo(0, 5000)); await p.waitForTimeout(800); assert(await p.locator('[role=dialog]').count() === 0, 'não aparece nas cartas de exemplo');

  step('2. Entrega agendada: contagem decrescente sem revelar conteúdo');
  const g = await (await browser.newContext({ ...devices['iPhone 12'], locale: 'pt-PT' })).newPage(); await g.goto(BASE + '/carta/' + PREP.locked.letter); await g.waitForSelector('[role=timer]');
  const html = await g.content(); assert(html.includes('Uma surpresa está a caminho') && !html.includes('o dia é teu') && !html.includes('Parabéns, Ana'), 'não revela título nem mensagem');
  const days = await g.locator('[role=timer] >> nth=0').innerText(); assert(/01\s*dias/.test(days.replace(/\n/g, ' ')), 'mostra 1 dia e algumas horas (' + days.replace(/\n/g, ' ') + ')'); await g.waitForTimeout(500); await g.screenshot({ path: 'shot-agendada.png' });
  const normal = await (await browser.newContext({ ...devices['iPhone 12'] })).newPage(); await normal.goto(BASE + '/carta/' + PREP.normal.letter); await normal.waitForSelector('text=Abrir o meu presente'); assert(true, 'carta sem agendamento abre normalmente');

  step('3. Cliente: cartões imprimíveis e aviso de agendamento');
  const c = await (await browser.newContext({ ...devices['Pixel 5'] })).newPage(); await c.goto(BASE + '/minha/' + PREP.locked.manage); await c.waitForSelector('text=Entrega agendada'); await c.screenshot({ path: 'shot-minha-agendada.png', fullPage: true });
  await c.goto(BASE + '/minha/' + PREP.normal.manage); await c.waitForSelector('text=Cartão para imprimir (PDF)'); await c.locator('text=Cartão para imprimir (PDF)').scrollIntoViewIfNeeded(); await c.waitForTimeout(400); await c.screenshot({ path: 'shot-minha-cartao.png' });
  for (const [label, size] of [['Cartão A6', 'a6'], ['Cartão pequeno', 'mini'], ['Folha A4 (4 cartões)', 'a4']]) {
    const [dl] = await Promise.all([c.waitForEvent('download'), c.getByRole('link', { name: label }).click()]); const f = `/tmp/pw/cartao-${size}.pdf`; await dl.saveAs(f);
    assert(fs.readFileSync(f).subarray(0, 5).toString() === '%PDF-', label + ' descarrega PDF válido');
  }
  execSync('cd /tmp/pw && pdftoppm -r 100 -png cartao-a6.pdf cartao-a6 && pdftoppm -r 80 -png cartao-a4.pdf cartao-a4 && pdftoppm -r 130 -png cartao-mini.pdf cartao-mini');
  const jsQR = require('jsqr'); const { PNG } = require('pngjs'); const png = PNG.sync.read(fs.readFileSync('/tmp/pw/cartao-a6-1.png'));
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height); assert(code && code.data === `${BASE}/carta/${PREP.normal.letter}`, 'QR do cartão A6 aponta para a carta certa');

  step('4. Admin vê os inscritos');
  const a = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); await a.goto(BASE + '/admin/login');
  await a.getByLabel('Email').fill('admin@test.local'); await a.getByLabel('Password').fill('Password#12345'); await a.getByRole('button', { name: 'Entrar' }).click(); await a.waitForSelector('text=Receita confirmada');
  await a.goto(BASE + '/admin/newsletter'); await a.waitForSelector('text=marcos@exemplo.com'); assert(await a.locator('text=rodape@exemplo.com').count() === 1, 'inscritos listados (popup e rodapé)');
  await a.screenshot({ path: 'shot-admin-newsletter.png' });
  const csv = await a.evaluate(async () => (await fetch('/api/admin/newsletter')).text()); assert(csv.includes('marcos@exemplo.com') && csv.includes('popup'), 'CSV exportável');
  assert(errs.length === 0, 'sem erros JS ' + errs.join('|'));
  await browser.close(); console.log('\nJORNADA DE MARKETING OK');
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
