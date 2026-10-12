// Remove metadados de privacidade das imagens antes de as guardar.
// Fotografias tiradas no telemóvel trazem muitas vezes a localização GPS exata de onde foram tiradas;
// numa carta partilhada por link isso revelaria, por exemplo, a morada de casa.
// - JPEG: apaga o bloco GPS do EXIF (mantém a orientação, para as fotos não aparecerem rodadas),
//         remove XMP e comentários.
// - PNG:  remove os blocos eXIf, tEXt, iTXt e zTXt.
// - WebP: remove os blocos EXIF e XMP.

function wipeJpegGps(seg: Buffer) {
  // seg = conteúdo do APP1 a seguir a "Exif\0\0"
  if (seg.length < 8) return;
  const le = seg.toString('latin1', 0, 2) === 'II';
  const u16 = (o: number) => (le ? seg.readUInt16LE(o) : seg.readUInt16BE(o));
  const u32 = (o: number) => (le ? seg.readUInt32LE(o) : seg.readUInt32BE(o));
  const SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
  const ifd0 = u32(4); if (ifd0 + 2 > seg.length) return;
  const n0 = u16(ifd0);
  for (let i = 0; i < n0; i++) {
    const e = ifd0 + 2 + i * 12; if (e + 12 > seg.length) return;
    if (u16(e) !== 0x8825) continue; // GPSInfo
    const gps = u32(e + 8); if (gps + 2 > seg.length) return;
    const n = u16(gps);
    for (let j = 0; j < n; j++) {
      const g = gps + 2 + j * 12; if (g + 12 > seg.length) break;
      const size = (SIZES[u16(g + 2)] || 1) * u32(g + 4);
      if (size > 4) { const off = u32(g + 8); if (off < seg.length) seg.fill(0, off, Math.min(seg.length, off + size)); }
    }
    seg.fill(0, gps + 2, Math.min(seg.length, gps + 2 + n * 12)); // apaga as entradas GPS
    if (le) seg.writeUInt16LE(0, gps); else seg.writeUInt16BE(0, gps);
  }
}

function stripJpeg(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 2)]; let p = 2;
  while (p + 4 <= buf.length) {
    if (buf[p] !== 0xff) return buf; // estrutura inesperada: devolve o original
    const marker = buf[p + 1];
    if (marker === 0xda) { out.push(buf.subarray(p)); return Buffer.concat(out); } // início dos dados da imagem
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { out.push(buf.subarray(p, p + 2)); p += 2; continue; }
    const len = buf.readUInt16BE(p + 2); const end = p + 2 + len; if (end > buf.length) return buf;
    const seg = Buffer.from(buf.subarray(p, end));
    if (marker === 0xe1) {
      if (seg.toString('latin1', 4, 10) === 'Exif\0\0') { wipeJpegGps(seg.subarray(10)); out.push(seg); } // XMP e outros APP1 são descartados
    } else if (marker === 0xfe || (marker >= 0xe3 && marker <= 0xed)) {
      // comentários e blocos de aplicação com metadados: descartados
    } else out.push(seg);
    p = end;
  }
  return buf;
}

function stripPng(buf: Buffer): Buffer {
  const drop = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt']);
  const out: Buffer[] = [buf.subarray(0, 8)]; let p = 8;
  while (p + 12 <= buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('latin1', p + 4, p + 8); const end = p + 12 + len;
    if (end > buf.length) return buf;
    if (!drop.has(type)) out.push(buf.subarray(p, end));
    p = end; if (type === 'IEND') break;
  }
  return Buffer.concat(out);
}

function stripWebp(buf: Buffer): Buffer {
  const out: Buffer[] = []; let p = 12;
  while (p + 8 <= buf.length) {
    const type = buf.toString('latin1', p, p + 4); const len = buf.readUInt32LE(p + 4); const end = p + 8 + len + (len & 1);
    if (end > buf.length) return buf;
    if (type !== 'EXIF' && type !== 'XMP ') {
      const chunk = Buffer.from(buf.subarray(p, end));
      if (type === 'VP8X') chunk[8] &= ~0x0c; // limpa as flags EXIF/XMP
      out.push(chunk);
    }
    p = end;
  }
  const body = Buffer.concat(out); const head = Buffer.from(buf.subarray(0, 12)); head.writeUInt32LE(body.length + 4, 4);
  return Buffer.concat([head, body]);
}

export function stripImageMetadata(buf: Buffer, mime: string): Buffer {
  try {
    if (mime === 'image/jpeg') return stripJpeg(buf);
    if (mime === 'image/png') return stripPng(buf);
    if (mime === 'image/webp') return stripWebp(buf);
  } catch { /* em caso de dúvida, mantém o ficheiro (já validado) */ }
  return buf;
}
