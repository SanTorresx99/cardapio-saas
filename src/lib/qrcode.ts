export async function gerarQRCodeDataURL(texto: string): Promise<string> {
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(texto, { width: 256, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } });
}
