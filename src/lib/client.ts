// Utilitários do lado do cliente (browser).
export type ApiResult<T = any> = { ok: true } & T | { ok: false; error: string; code?: string };

export async function api<T = any>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const r = await fetch(url, init);
    const j = await r.json().catch(() => null);
    if (!j) return { ok: false, error: 'Resposta inesperada do servidor. Tenta novamente.' };
    return j;
  } catch {
    return { ok: false, error: 'Sem ligação à internet. Verifica a tua rede e tenta novamente.', code: 'network' };
  }
}
export const jsonInit = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** Reduz imagens grandes no telemóvel antes do envio (poupa dados e tempo). */
export async function compressImage(file: File, maxSide = 1800, quality = 0.85): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise(res => c.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return file; }
}

/** Upload com progresso. */
export function uploadWithProgress(url: string, form: FormData, onProgress: (pct: number) => void): Promise<ApiResult> {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({ ok: false, error: 'Resposta inesperada do servidor.' }); } };
    xhr.onerror = () => resolve({ ok: false, error: 'Falha de ligação durante o envio. Tenta novamente.', code: 'network' });
    xhr.ontimeout = () => resolve({ ok: false, error: 'O envio demorou demasiado. Tenta com um ficheiro mais pequeno ou uma ligação melhor.', code: 'network' });
    xhr.timeout = 5 * 60_000;
    xhr.send(form);
  });
}
