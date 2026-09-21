// Cartão imprimível (PDF) com o QR Code da carta: A6, cartão pequeno (9×5,5 cm) ou folha A4 com 4 cartões A6.
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib';
import { qrPng } from './qr';

export type CardSize = 'a6' | 'mini' | 'a4';
export type CardInput = { url: string; title: string; date?: string; instruction: string; kind: 'carta' | 'evento'; reference: string };

const WINE = rgb(0x52 / 255, 0x13 / 255, 0x28 / 255), GOLD = rgb(0xC9 / 255, 0xA4 / 255, 0x5C / 255), GOLD_DEEP = rgb(0x94 / 255, 0x72 / 255, 0x2D / 255), CREAM = rgb(0xFA / 255, 0xF8 / 255, 0xF3 / 255), MUTED = rgb(0x6F / 255, 0x5A / 255, 0x60 / 255);
const MM = 72 / 25.4;

/** Remove caracteres que as fontes padrão do PDF não conseguem escrever (emojis, símbolos). */
function safe(text: string, font: PDFFont): string {
  let out = '';
  for (const ch of text.replace(/\s+/g, ' ')) { try { font.encodeText(ch); out += ch; } catch { /* ignora */ } }
  return out.trim();
}
function wrap(text: string, font: PDFFont, size: number, maxW: number, maxLines: number): string[] {
  const words = text.split(' '); const lines: string[] = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (font.widthOfTextAtSize(t, size) <= maxW) cur = t; else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] = keep[maxLines - 1].replace(/\s*\S*$/, '') + '…'; return keep; }
  return lines;
}
const center = (page: PDFPage, text: string, font: PDFFont, size: number, cx: number, y: number, color = WINE) => page.drawText(text, { x: cx - font.widthOfTextAtSize(text, size) / 2, y, size, font, color });

type Assets = { serif: PDFFont; serifB: PDFFont; sans: PDFFont; mark: PDFImage; qr: PDFImage };

function frame(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, color: CREAM });
  page.drawRectangle({ x: x + 6, y: y + 6, width: w - 12, height: h - 12, borderColor: GOLD, borderWidth: 1.2 });
  page.drawRectangle({ x: x + 10, y: y + 10, width: w - 20, height: h - 20, borderColor: WINE, borderWidth: 0.4 });
}

function portrait(page: PDFPage, x: number, y: number, w: number, h: number, a: Assets, c: CardInput) {
  frame(page, x, y, w, h); const cx = x + w / 2; const k = w / 297.6; // escala relativa ao A6
  const markH = 46 * k, markW = markH * (a.mark.width / a.mark.height);
  page.drawImage(a.mark, { x: cx - markW / 2, y: y + h - 24 * k - markH, width: markW, height: markH });
  let ty = y + h - 24 * k - markH - 22 * k;
  center(page, c.kind === 'evento' ? 'CONVITE QR' : 'CARTA QR', a.sans, 7 * k, cx, ty, GOLD_DEEP); ty -= 22 * k;
  const title = safe(c.title, a.serifB) || 'Uma surpresa para ti';
  for (const l of wrap(title, a.serifB, 19 * k, w - 56 * k, 3)) { center(page, l, a.serifB, 19 * k, cx, ty, WINE); ty -= 22 * k; }
  if (c.date) { center(page, safe(c.date, a.serif), a.serif, 10 * k, cx, ty + 4 * k, MUTED); ty -= 10 * k; }
  const qrS = Math.min(178 * k, ty - (y + 84 * k)); const qy = ty - qrS - 8 * k;
  page.drawRectangle({ x: cx - qrS / 2 - 7 * k, y: qy - 7 * k, width: qrS + 14 * k, height: qrS + 14 * k, color: rgb(1, 1, 1), borderColor: GOLD, borderWidth: 0.8 });
  page.drawImage(a.qr, { x: cx - qrS / 2, y: qy, width: qrS, height: qrS });
  let iy = qy - 28 * k;
  for (const l of wrap(safe(c.instruction, a.serifB), a.serifB, 11 * k, w - 56 * k, 2)) { center(page, l, a.serifB, 11 * k, cx, iy, WINE); iy -= 14 * k; }
  center(page, 'CONECTANDO MENSAGENS DIGITALMENTE', a.sans, 5.4 * k, cx, y + 20 * k, GOLD_DEEP);
}

function landscape(page: PDFPage, x: number, y: number, w: number, h: number, a: Assets, c: CardInput) {
  frame(page, x, y, w, h); const pad = 16;
  const qrS = h - 2 * pad - 6; const qx = x + pad + 2, qy = y + (h - qrS) / 2;
  page.drawRectangle({ x: qx - 3, y: qy - 3, width: qrS + 6, height: qrS + 6, color: rgb(1, 1, 1), borderColor: GOLD, borderWidth: 0.6 });
  page.drawImage(a.qr, { x: qx, y: qy, width: qrS, height: qrS });
  const tx = qx + qrS + 14, tw = x + w - pad - tx; const cx = tx + tw / 2;
  const markH = 24, markW = markH * (a.mark.width / a.mark.height);
  page.drawImage(a.mark, { x: cx - markW / 2, y: y + h - pad - markH - 2, width: markW, height: markH });
  let ty = y + h - pad - markH - 14;
  for (const l of wrap(safe(c.title, a.serifB) || 'Uma surpresa para ti', a.serifB, 10.5, tw, 3)) { center(page, l, a.serifB, 10.5, cx, ty); ty -= 12.5; }
  ty -= 3; for (const l of wrap(safe(c.instruction, a.serif), a.serif, 7.4, tw, 2)) { center(page, l, a.serif, 7.4, cx, ty, MUTED); ty -= 9; }
  center(page, 'CARTA QR', a.sans, 5, cx, y + pad, GOLD_DEEP);
}

export async function buildCardPdf(size: CardSize, c: CardInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create(); pdf.setTitle(`Cartão QR ${c.reference}`); pdf.setCreator('Carta QR');
  const [serif, serifB, sans] = await Promise.all([pdf.embedFont(StandardFonts.TimesRoman), pdf.embedFont(StandardFonts.TimesRomanBold), pdf.embedFont(StandardFonts.Helvetica)]);
  const mark = await pdf.embedPng(fs.readFileSync(path.join(process.cwd(), 'public', 'logo-mark.png')));
  const qr = await pdf.embedPng(await qrPng(c.url, 900));
  const assets: Assets = { serif, serifB, sans, mark, qr };
  if (size === 'mini') { const w = 90 * MM, h = 55 * MM; landscape(pdf.addPage([w, h]), 0, 0, w, h, assets, c); }
  else if (size === 'a6') { const w = 105 * MM, h = 148 * MM; portrait(pdf.addPage([w, h]), 0, 0, w, h, assets, c); }
  else {
    const W = 210 * MM, H = 297 * MM, w = 105 * MM, h = 148.5 * MM; const page = pdf.addPage([W, H]);
    for (const [gx, gy] of [[0, 1], [1, 1], [0, 0], [1, 0]]) portrait(page, gx * w, gy * h, w, h, assets, c);
    const cut = { color: rgb(0.7, 0.7, 0.7), thickness: 0.4, dashArray: [3, 3] };
    page.drawLine({ start: { x: w, y: 0 }, end: { x: w, y: H }, ...cut }); page.drawLine({ start: { x: 0, y: h }, end: { x: W, y: h }, ...cut });
  }
  return pdf.save();
}
