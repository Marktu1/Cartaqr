import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';
export const alt = 'Carta QR'; export const size = { width: 1200, height: 630 }; export const contentType = 'image/png';
export default function Image() {
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(process.cwd(), 'public', 'logo-full.png')).toString('base64');
  return new ImageResponse(
    (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 80, background: 'linear-gradient(135deg,#FAF8F3,#F3E6E8)', color: '#3A0D1C', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 600 }}>
        <div style={{ fontSize: 60, lineHeight: 1.12 }}>Transforma uma mensagem num presente digital inesquecível.</div>
        <div style={{ fontSize: 28, marginTop: 28, color: '#6F5A60' }}>Cartas e convites · Link privado · QR Code</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={400} height={330} alt="" />
    </div>), size);
}
