// Verificação de dependências: falha se houver vulnerabilidades altas/críticas no que corre em produção.
// As ferramentas de compilação do Tailwind CSS 3 (só usadas durante o "build", nunca enviadas para o
// servidor nem para o browser) ficam numa lista à parte até à migração para o Tailwind 4.
import { execSync } from 'node:child_process';

const BUILD_ONLY = new Set(['tailwindcss', 'braces', 'chokidar', 'micromatch', 'fast-glob', 'postcss-selector-parser', 'postcss-nested', 'readdirp', 'anymatch']);
let raw;
try { raw = execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { raw = e.stdout; }
const vulns = Object.values(JSON.parse(raw).vulnerabilities || {});
const bad = vulns.filter(v => ['high', 'critical'].includes(v.severity) && !BUILD_ONLY.has(v.name));
for (const v of vulns) console.log(`${BUILD_ONLY.has(v.name) ? '  (só build) ' : '  '}${v.severity.padEnd(8)} ${v.name} ${v.range}`);
if (bad.length) { console.error(`\n${bad.length} vulnerabilidade(s) alta(s)/crítica(s) em dependências de produção.`); process.exit(1); }
console.log('\nSem vulnerabilidades altas ou críticas em dependências de produção.');
