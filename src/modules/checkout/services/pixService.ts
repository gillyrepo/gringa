export interface PixParams {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  txid?: string;
}

function crc16(payload: string): string {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export const gerarPix = ({
  chave,
  nome,
  cidade,
  valor,
  txid = '***',
}: PixParams): string => {
  const valorStr = valor.toFixed(2);

  const formatField = (id: string, val: string) => {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  };

  const payload =
    '000201' +
    formatField('26', `${formatField('00', 'BR.GOV.BCB.PIX')}${formatField('01', chave)}`) +
    '52040000' +
    '5303986' +
    formatField('54', valorStr) +
    '5802BR' +
    formatField('59', nome.slice(0, 25)) +
    formatField('60', cidade.slice(0, 15)) +
    formatField('62', formatField('05', txid)) +
    '6304';

  return payload + crc16(payload);
};
