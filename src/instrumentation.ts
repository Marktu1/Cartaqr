// Corre uma vez ao arrancar o servidor: cria planos, ocasiões e o administrador se ainda não existirem.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    const { seed } = await import('./lib/seed');
    await seed();
  } catch (e) {
    console.warn('[seed] ignorado:', e instanceof Error ? e.message : e);
  }
}
