'use client';

/** Camada visual do ambiente sensorial (por cima da carta, sem bloquear toques). */
export function MoodLayer({ mood }: { mood?: string }) {
  if (!mood || mood === 'classico') return null;
  if (mood === 'chuva') return (
    <div className="mood-rain no-print" aria-hidden>{Array.from({ length: 40 }, (_, i) => <i key={i} style={{ left: `${(i * 2.5 + (i % 3) * 7) % 100}%`, animationDelay: `${(i * 0.37) % 2.4}s`, animationDuration: `${0.9 + (i % 5) * 0.18}s` }} />)}</div>
  );
  if (mood === 'por-do-sol') return (
    <div className="mood-sunset no-print" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ left: `${(i * 41) % 100}%`, animationDelay: `${(i % 9) * 1.1}s` }} />)}</div>
  );
  return null; // 'diario' e 'panos' são estilos aplicados diretamente à carta (CSS)
}

/** Botão "Luz de velas": escurece a página e acende um brilho quente e tremeluzente. */
export function CandleToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={on} className="candle-toggle no-print" title={on ? 'Apagar as velas' : 'Ler à luz de velas'}>
      <span aria-hidden>{on ? '🕯️' : '🕯'}</span><span className="sr-only">{on ? 'Desligar luz de velas' : 'Ler à luz de velas'}</span>
    </button>
  );
}

export function CandleLayer({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div className="candle-layer no-print" aria-hidden>
      <div className="candle-glow" />
      {Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i * 29) % 100}%`, animationDelay: `${(i % 8) * 0.9}s` }} />)}
    </div>
  );
}
