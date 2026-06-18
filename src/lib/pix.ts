function emv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sanitizar(texto: string, limite: number): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .slice(0, limite)
    .trim();
}

export interface PixParams {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valor: number;
  txid?: string;
  descricao?: string;
}

export function gerarPixPayload(params: PixParams): string {
  const { chave, nomeRecebedor, cidade, valor, txid = '***', descricao } = params;

  const merchantInfo = [
    emv('00', 'br.gov.bcb.pix'),
    emv('01', chave),
    ...(descricao ? [emv('02', descricao.slice(0, 72))] : []),
  ].join('');

  const additionalData = emv('05', sanitizar(txid, 25) || '***');

  const payload = [
    emv('00', '01'),
    emv('26', merchantInfo),
    emv('52', '0000'),
    emv('53', '986'),
    emv('54', valor.toFixed(2)),
    emv('58', 'BR'),
    emv('59', sanitizar(nomeRecebedor, 25)),
    emv('60', sanitizar(cidade, 15)),
    emv('62', additionalData),
    '6304',
  ].join('');

  return payload + crc16(payload);
}
