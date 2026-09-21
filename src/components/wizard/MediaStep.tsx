'use client';
import { useRef, useState } from 'react';
import { api, jsonInit, compressImage, uploadWithProgress } from '@/lib/client';
import type { ServerState } from './types';

type Upload = { key: string; name: string; pct: number; error?: string };

export function MediaStep({ token, server, setServer }: { token: string; server: ServerState; setServer: (s: ServerState) => void }) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [msg, setMsg] = useState('');
  const { plan, limits } = server;
  const photos = server.media.filter(m => m.type === 'photo'); const cover = server.media.find(m => m.type === 'cover');
  const video = server.media.filter(m => m.type === 'video'); const audio = server.media.filter(m => m.type === 'audio');

  async function send(files: FileList | null, kind: 'photo' | 'cover' | 'video' | 'audio') {
    if (!files || !files.length) return; setMsg('');
    let remaining = kind === 'photo' ? plan.maxPhotos - photos.length : kind === 'video' ? plan.maxVideos - video.length : kind === 'audio' ? plan.maxAudio - audio.length - server.media.filter(m => m.type === 'music').length : 1;
    for (const original of Array.from(files)) {
      const key = `${Date.now()}-${Math.random()}`;
      const upd = (p: Partial<Upload>) => setUploads(u => u.map(x => (x.key === key ? { ...x, ...p } : x)));
      setUploads(u => [...u, { key, name: original.name, pct: 0 }]);
      if (remaining <= 0) { upd({ error: kind === 'photo' ? `Limite de ${plan.maxPhotos} fotografias do plano ${plan.name} atingido.` : 'Limite do plano atingido.' }); continue; }
      const file = kind === 'photo' || kind === 'cover' ? await compressImage(original) : original;
      const maxMb = kind === 'video' ? limits.video : kind === 'audio' ? limits.audio : limits.image;
      if (file.size > maxMb * 1024 * 1024) { upd({ error: `Ficheiro demasiado grande (${(file.size / 1048576).toFixed(1)} MB). O máximo é ${maxMb} MB.` }); continue; }
      const form = new FormData(); form.append('file', file); form.append('kind', kind);
      const res: any = await uploadWithProgress(`/api/orders/${token}/media`, form, pct => upd({ pct }));
      if (res.ok) { setServer(res as ServerState); remaining--; setUploads(u => u.filter(x => x.key !== key)); } else upd({ error: res.error, pct: 0 });
    }
  }
  async function remove(id: number) {
    if (!window.confirm('Remover este ficheiro?')) return;
    const r: any = await api(`/api/orders/${token}/media/${id}`, { method: 'DELETE' });
    if (r.ok) setServer(r); else setMsg(r.error);
  }
  async function caption(id: number, caption: string) {
    const r: any = await api(`/api/orders/${token}/media/${id}`, jsonInit('PATCH', { caption })); if (r.ok) setServer(r);
  }
  const Drop = ({ id, label, accept, kind, multiple, disabled, hint }: { id: string; label: string; accept: string; kind: 'photo' | 'cover' | 'video' | 'audio'; multiple?: boolean; disabled?: boolean; hint: string }) => (
    <div className={disabled ? 'opacity-60' : ''}>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} type="file" accept={accept} multiple={multiple} disabled={disabled} className="field cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-rose-soft file:px-4 file:py-2 file:font-semibold file:text-wine"
        onChange={e => { send(e.target.files, kind); e.target.value = ''; }} />
      <p className="hint">{hint}</p>
    </div>
  );
  return (
    <div className="space-y-8">
      <p className="rounded-xl bg-rose-soft/50 p-3 text-sm">Só carrega fotografias, vídeos e áudios de que tens autorização (das pessoas que aparecem e de quem os criou).</p>

      <section aria-labelledby="up-cover" className="space-y-3">
        <h3 id="up-cover" className="h-display text-lg font-semibold text-wine">Imagem de capa</h3>
        <Drop id="in-cover" label="Escolhe a imagem de capa" accept="image/jpeg,image/png,image/webp" kind="cover" hint={`JPG, PNG ou WebP, até ${limits.image} MB. As imagens grandes são reduzidas automaticamente.`} />
        {cover && <div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={cover.url} alt="Imagem de capa escolhida" className="h-20 w-16 rounded-lg object-cover" /><button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(cover.id)}>Remover capa</button></div>}
      </section>

      <section aria-labelledby="up-photos" className="space-y-3">
        <h3 id="up-photos" className="h-display text-lg font-semibold text-wine">Fotografias <span className="text-sm font-normal text-muted">({photos.length}/{plan.maxPhotos})</span></h3>
        <Drop id="in-photos" label="Adiciona fotografias" accept="image/jpeg,image/png,image/webp" kind="photo" multiple hint="Podes escolher várias de uma vez." />
        {photos.length === 0 ? <p className="rounded-xl border border-dashed border-wine/25 p-4 text-center text-sm text-muted">Ainda não adicionaste fotografias. Podes continuar sem elas, mas uma carta com fotos fica bem mais especial.</p> : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <li key={p.id} className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption || `Fotografia ${i + 1}`} className="aspect-square w-full object-cover" />
                <div className="space-y-2 p-2">
                  <label className="sr-only" htmlFor={`cap-${p.id}`}>Legenda da fotografia {i + 1}</label>
                  <input id={`cap-${p.id}`} defaultValue={p.caption} maxLength={200} placeholder="Legenda (opcional)" className="field !min-h-[40px] !py-2 text-sm" onBlur={e => e.target.value !== p.caption && caption(p.id, e.target.value)} />
                  <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => remove(p.id)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="up-video" className="space-y-3">
        <h3 id="up-video" className="h-display text-lg font-semibold text-wine">Vídeo curto</h3>
        <Drop id="in-video" label="Adiciona um vídeo" accept="video/mp4,video/quicktime,video/webm" kind="video" disabled={plan.maxVideos === 0} hint={plan.maxVideos === 0 ? `O plano ${plan.name} não inclui vídeo. Podes mudar de plano na etapa 2.` : `MP4, MOV ou WebM, até ${limits.video} MB.`} />
        {video.map(v => <div key={v.id} className="flex items-center justify-between rounded-xl border border-wine/10 p-3 text-sm"><span>🎬 {v.name || 'Vídeo'} · {(v.size / 1048576).toFixed(1)} MB</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(v.id)}>Remover</button></div>)}
      </section>

      <section aria-labelledby="up-audio" className="space-y-3">
        <h3 id="up-audio" className="h-display text-lg font-semibold text-wine">Mensagem de áudio</h3>
        <Drop id="in-audio" label="Adiciona um áudio (por exemplo, uma mensagem de voz)" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" kind="audio" disabled={plan.maxAudio === 0} hint={plan.maxAudio === 0 ? `O plano ${plan.name} não inclui áudio.` : `MP3, M4A, OGG ou WAV, até ${limits.audio} MB.`} />
        {audio.map(v => <div key={v.id} className="flex items-center justify-between rounded-xl border border-wine/10 p-3 text-sm"><span>🎙 {v.name || 'Áudio'} · {(v.size / 1048576).toFixed(1)} MB</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(v.id)}>Remover</button></div>)}
      </section>

      {uploads.length > 0 && (
        <ul className="space-y-2" aria-live="polite" aria-label="Estado dos envios">
          {uploads.map(u => (
            <li key={u.key} className="rounded-xl border border-wine/10 bg-white p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="truncate">{u.name}</span>{u.error ? <button className="font-semibold text-wine underline" onClick={() => setUploads(x => x.filter(y => y.key !== u.key))}>Fechar</button> : <span>{u.pct}%</span>}</div>
              {u.error ? <p role="alert" className="mt-1 font-semibold text-red-700">{u.error}</p> : <div className="mt-2 h-2 overflow-hidden rounded bg-rose-soft" role="progressbar" aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-wine transition-all" style={{ width: `${u.pct}%` }} /></div>}
            </li>
          ))}
        </ul>
      )}
      {msg && <p role="alert" className="text-sm font-semibold text-red-700">{msg}</p>}
    </div>
  );
}
