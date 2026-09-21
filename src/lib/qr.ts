import QRCode from 'qrcode';

export async function qrPng(url: string, size = 800): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: 'png', width: size, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#3A0D1C', light: '#FFFFFF' } });
}
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#3A0D1C', light: '#FFFFFF' } });
}
