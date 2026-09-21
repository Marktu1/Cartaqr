'use client';
import { useEffect, useRef, useState } from 'react';

/** Ambiente sonoro gerado no navegador (sem ficheiros nem direitos de autor). Só inicia após toque do utilizador. */
export function AmbientPlayer({ kind, label }: { kind: string; label?: string }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => () => { stopRef.current?.(); ctxRef.current?.close().catch(() => {}); }, []);

  function start() {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC(); ctxRef.current = ctx;
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2);
    const nodes: AudioNode[] = []; const timers: number[] = [];
    if (kind === 'piano-suave') {
      const chords = [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]];
      let i = 0;
      const play = () => {
        chords[i % chords.length].forEach((f, k) => {
          const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f / (k === 0 ? 2 : 1);
          g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.2);
          o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 4.4);
        });
        i++;
      };
      play(); timers.push(window.setInterval(play, 3600));
    } else {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0);
      let last = 0; for (let n = 0; n < d.length; n++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[n] = last * 3.5; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = kind === 'chuva-leve' ? 'highpass' : 'lowpass'; f.frequency.value = kind === 'chuva-leve' ? 1800 : 600;
      const g = ctx.createGain(); g.gain.value = kind === 'ondas' ? 0.6 : 0.5;
      if (kind === 'ondas') { const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.35; lfo.connect(lg); lg.connect(g.gain); lfo.start(); nodes.push(lfo); }
      src.connect(f); f.connect(g); g.connect(master); src.start(); nodes.push(src);
    }
    stopRef.current = () => { timers.forEach(clearInterval); nodes.forEach(n => { try { (n as any).stop?.(); } catch {} }); master.gain.value = 0; };
    setOn(true);
  }
  function stop() { stopRef.current?.(); ctxRef.current?.close().catch(() => {}); ctxRef.current = null; setOn(false); }

  return (
    <button type="button" onClick={on ? stop : start} aria-pressed={on} className="btn btn-secondary btn-sm">
      <span aria-hidden>{on ? '❚❚' : '▶'}</span> {on ? 'Pausar ambiente' : label || 'Ouvir ambiente sonoro'}
    </button>
  );
}
