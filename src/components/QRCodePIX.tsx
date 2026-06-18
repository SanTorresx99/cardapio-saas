import { useState, useEffect } from 'react';
import { gerarQRCodeDataURL } from '@/lib/qrcode';
import { formatarPreco } from '@/lib/carrinho';

interface Props {
  pixPayload: string;
  valor: number;
  nomeRecebedor: string;
}

export default function QRCodePIX({ pixPayload, valor, nomeRecebedor }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    gerarQRCodeDataURL(pixPayload).then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [pixPayload]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      const input = document.createElement('textarea');
      input.value = pixPayload;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 text-center space-y-4">
      <div>
        <p className="text-sm text-gray-500 mb-1">Total a pagar</p>
        <p className="text-3xl font-bold text-orange-600">{formatarPreco(valor)}</p>
        <p className="text-sm text-gray-400 mt-1">para {nomeRecebedor}</p>
      </div>

      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-xl" />
      ) : (
        <div className="w-48 h-48 mx-auto rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Gerando QR Code...
        </div>
      )}

      <p className="text-sm text-gray-600 font-medium">
        Escaneie o QR Code no app do seu banco
      </p>

      <div className="border-t pt-4">
        <p className="text-xs text-gray-400 mb-2">Ou copie o código PIX Copia e Cola:</p>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 break-all text-left mb-3 max-h-20 overflow-y-auto">
          {pixPayload}
        </div>
        <button
          onClick={copiar}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${
            copiado
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {copiado ? '✓ Código Copiado!' : 'Copiar Código PIX'}
        </button>
      </div>
    </div>
  );
}
