import { describe, it, expect } from 'vitest';
import { gerarPix } from '@/modules/checkout/services/pixService';

describe('gerarPix (BR Code EMVCo)', () => {
  it('generates valid BR Code payload with formatted amount and 4-hex CRC16', () => {
    const code = gerarPix({
      chave: '65649727000140',
      nome: 'GRINGA STORE',
      cidade: 'SAO PAULO',
      valor: 49.9,
      txid: 'GRINGA1234',
    });

    expect(code.startsWith('00020126360014BR.GOV.BCB.PIX011465649727000140')).toBe(true);
    expect(code).toContain('5303986540549.905802BR');
    expect(code).toMatch(/6304[0-9A-F]{4}$/);
  });
});
