// Jornada 2: convite de evento (pacote de Eventos) com RSVP + pedido de namoro. Requer servidor em :3111 e a mesma BD (DATA_DIR) para o passo de admin.
const { chromium, devices } = require('playwright-core');
const BASE = 'http://localhost:3111';
const step = m => console.log('•', m);
const assert = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('  ✓', m); };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ ...devices['Pixel 5'], locale: 'pt-AO' }); const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());

  step('1. Landing (categorias + banda Eventos) e preços');
  await page.goto(BASE); await page.waitForSelector('#eventos');
  assert(/4\s500\s*Kz/.test(await page.content()), 'preço mais barato 4 500 Kz na landing');
  await page.locator('#eventos').scrollIntoViewIfNeeded(); await page.screenshot({ path: 'shot-landing-eventos.png' });
  await page.goto(BASE + '/precos'); await page.waitForSelector('#eventos');
  const txt = await page.locator('body').innerText();
  assert(/25\s000\s*Kz/.test(txt) && /45\s000\s*Kz/.test(txt) && /80\s000\s*Kz/.test(txt), 'pacotes de Eventos 25 000 / 45 000 / 80 000 Kz');
  await page.locator('#eventos').scrollIntoViewIfNeeded(); await page.screenshot({ path: 'shot-precos-eventos.png' });
  await page.goto(BASE + '/ocasioes/convite-casamento'); await page.waitForSelector('h1'); await page.screenshot({ path: 'shot-categoria.png' });
  assert((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'sem scroll horizontal na página de categoria');

  step('2. Wizard de evento: só pacotes de Eventos');
  await page.goto(BASE + '/criar');
  await page.locator('label:has-text("Convite de casamento")').first().click(); await page.getByRole('button', { name: 'Continuar' }).click();
  assert(await page.locator('label:has-text("Evento Básico")').count() >= 1 && await page.locator('label:has-text("Romântico")').count() === 0, 'só mostra pacotes de eventos');
  await page.locator('label:has-text("Evento Premium")').first().click(); await page.screenshot({ path: 'shot-wizard-eventos.png' });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  assert(await page.locator('[role=alert]').count() > 0, 'campos obrigatórios do evento validados (data, hora, local)');
  await page.getByLabel('Para quem é o convite?').fill('Família e amigos'); await page.getByLabel('Os noivos').fill('Marta & Rui Exemplo');
  await page.getByLabel('Título do convite', { exact: true }).fill('Vamos celebrar o nosso sim'); await page.getByLabel('Data do evento').fill('2099-06-19');
  await page.locator('#x-time').fill('16:00'); await page.locator('#x-venue').fill('Salão Jardim das Acácias');
  await page.getByLabel('O teu email ou WhatsApp').fill('923 111 222'); await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForSelector('#main'); assert(await page.getByLabel('Como se conheceram?').count() === 0, 'campo “como se conheceram” não existe em eventos');
  await page.locator('#m-t-0').fill('16:00 Cerimónia'); await page.locator('#main').fill('Será uma honra ter-vos connosco neste dia tão especial.');
  await page.getByRole('button', { name: 'Continuar' }).click(); await page.waitForSelector('#in-photos');
  await page.setInputFiles('#in-cover', __dirname + '/photo0.jpg'); await page.waitForSelector('img[alt="Imagem de capa escolhida"]');
  await page.getByRole('button', { name: 'Continuar' }).click(); await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForSelector('text=Vê como vai ficar'); assert(await page.getByText('Permitir que a pessoa responda').count() === 0, 'sem “permitir resposta” em convites (têm RSVP)');
  await page.screenshot({ path: 'shot-wizard-preview-evento.png', fullPage: true });
  await page.getByRole('button', { name: 'Continuar para o pagamento' }).click();
  await page.waitForSelector('text=Como pagar'); assert(await page.locator('text=/45\\s000\\s*Kz/').count() > 0, 'pagamento com o valor do pacote (45 000 Kz)');
  await page.setInputFiles('#proof', __dirname + '/proof.png'); await page.getByRole('button', { name: 'Enviar comprovativo' }).click(); await page.waitForSelector('text=Recebemos o teu pedido.');
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('cq_wizard_v1')).token);

  step('3. Admin confirma e publica');
  const actx = await browser.newContext({ ...devices['Desktop Chrome'] }); const admin = await actx.newPage(); admin.on('dialog', d => d.accept());
  await admin.goto(BASE + '/admin/login'); await admin.getByLabel('Email').fill('admin@test.local'); await admin.getByLabel('Password').fill('Password#12345'); await admin.getByRole('button', { name: 'Entrar' }).click();
  await admin.waitForSelector('text=Receita confirmada'); await admin.screenshot({ path: 'shot-admin-dashboard.png', fullPage: true });
  await admin.getByPlaceholder('Pesquisar por nome, telefone, email ou código').fill('923111222'); await admin.getByRole('button', { name: 'Filtrar' }).click();
  await admin.locator('tbody a').first().click(); await admin.waitForSelector('text=Comprovativo de pagamento');
  assert(await admin.locator('text=Convite de casamento').count() > 0, 'admin vê a categoria');
  await admin.getByRole('button', { name: 'Confirmar pagamento' }).click(); await admin.waitForSelector('text=Pagamento confirmado.');
  await admin.getByRole('button', { name: 'Publicar carta' }).click(); await admin.waitForSelector('text=Carta publicada.');

  step('4. Convidado abre o convite e confirma presença');
  await page.goto(BASE + '/minha/' + token); await page.waitForSelector('img[alt^="QR Code"]');
  assert(await page.locator('text=Lê o código para abrir o convite').count() > 0, 'cartão do QR com texto de convite');
  await page.screenshot({ path: 'shot-qr-evento.png', fullPage: true });
  const link = await page.locator('p[aria-label="Link da carta"]').innerText();
  const gctx = await browser.newContext({ ...devices['iPhone 12'], locale: 'pt-PT' }); const g = await gctx.newPage(); const gerr = []; g.on('pageerror', e => gerr.push(e.message));
  await g.goto(link); await g.getByRole('button', { name: /Abrir o convite/ }).click(); await g.waitForSelector('text=Confirma a tua presença');
  assert(await g.locator('text=Salão Jardim das Acácias').count() > 0 && await g.locator('text=16:00').count() > 0, 'local e hora visíveis');
  await g.locator('text=Confirma a tua presença').scrollIntoViewIfNeeded(); await g.waitForTimeout(700); await g.screenshot({ path: 'shot-convite-rsvp.png' });
  await g.locator('#rs-name').fill('João Silva'); await g.getByRole('button', { name: 'Enviar resposta' }).click();
  await g.waitForSelector('text=/Obrigado|confirmad|Recebemos/i'); assert(true, 'RSVP enviado');
  await g.screenshot({ path: 'shot-convite-rsvp-ok.png' });
  await page.goto(BASE + '/minha/' + token); await page.waitForSelector('text=Confirmações de presença');
  assert(await page.locator('text=João Silva').count() > 0, 'cliente vê o convidado na lista'); await page.screenshot({ path: 'shot-minha-rsvp.png', fullPage: true });
  await admin.reload(); assert(await admin.locator('text=João Silva').count() > 0, 'admin vê o convidado');
  assert(gerr.length === 0, 'sem erros JS no convite ' + gerr.join('|'));

  step('5. Pedido de namoro: pergunta e resposta');
  const dctx = await browser.newContext({ ...devices['iPhone 12'] }); const d = await dctx.newPage();
  await d.goto(BASE + '/exemplos/pergunta-para-ti'); await d.getByRole('button', { name: /^Abrir/ }).click(); await d.waitForSelector('text=Queres namorar comigo?');
  await d.getByRole('button', { name: 'Sim!' }).scrollIntoViewIfNeeded(); await d.waitForTimeout(700); await d.screenshot({ path: 'shot-pedido-namoro.png' });
  await d.getByRole('button', { name: 'Sim!' }).click(); await d.waitForSelector('text=Que comece uma linda história'); assert(true, 'resposta do exemplo (nada é enviado)');
  await d.goto(BASE + '/exemplos/convite-casamento'); await d.getByRole('button', { name: /^Abrir/ }).click(); await d.waitForSelector('text=Confirma a tua presença'); await d.waitForTimeout(600);
  await d.screenshot({ path: 'shot-exemplo-convite.png' });

  assert(errors.length === 0, 'sem erros JS no cliente ' + errors.join('|'));
  await browser.close(); console.log('\nJORNADA DE EVENTOS OK');
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
