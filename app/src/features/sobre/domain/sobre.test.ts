import { describe, expect, it } from 'vitest';
import { formatarData, passouDoLimite, percentualDeUso, resumoParaSuporte, textoDeLicencas, type InfoSistema } from './sobre';

const info: InfoSistema = { licencasUsadas: 4, licencasContratadas: 50, versaoApp: '2.0.10.80', versaoBanco: '3.02.16.114', atualizadoEm: '2026-10-03' };

describe('licenças', () => {
  it('calcula o percentual de uso sem passar de 100', () => {
    expect(percentualDeUso(4, 50)).toBe(8);
    expect(percentualDeUso(60, 50)).toBe(100);
    expect(percentualDeUso(0, 0)).toBe(0);
    expect(percentualDeUso(1, 0)).toBe(100);
  });
  it('avisa só acima de 90%', () => {
    expect(passouDoLimite(45, 50)).toBe(false);
    expect(passouDoLimite(46, 50)).toBe(true);
    expect(passouDoLimite(4, 50)).toBe(false);
    expect(passouDoLimite(1, 0)).toBe(false);
  });
  it('escreve o uso por extenso', () => {
    expect(textoDeLicencas(4, 50)).toBe('4 de 50 licenças em uso');
    expect(textoDeLicencas(1, 1)).toBe('1 de 1 licença em uso');
  });
});

describe('resumo para suporte', () => {
  it('traz versões, data, licenças e o site de suporte', () => {
    expect(formatarData('2026-10-03')).toBe('03/10/2026');
    expect(resumoParaSuporte(info)).toBe([
      'Scua Logon',
      'Versão do aplicativo: 2.0.10.80',
      'Versão do banco de dados: 3.02.16.114',
      'Última atualização: 03/10/2026',
      'Licenças: 4 de 50 licenças em uso',
      'Suporte: https://scua.com.br/',
    ].join('\n'));
  });
});
