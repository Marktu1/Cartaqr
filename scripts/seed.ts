import fs from 'node:fs';
// carrega .env.local manualmente (sem dependências extra)
for (const f of ['.env.local', '.env']) {
  if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
async function main() {
  const { seed } = await import('../src/lib/seed');
  await seed();
  console.log('Seed concluído: planos, ocasiões e administrador.');
}
main().catch((e) => { console.error(e.message); process.exit(1); });
