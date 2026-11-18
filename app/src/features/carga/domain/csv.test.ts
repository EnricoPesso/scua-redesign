import { describe, expect, it } from 'vitest';
import { cargaPorId, CARGAS, gerarModelo } from './cargas';
import { detectarSeparador, gerarCsv, lerCsv } from './csv';
import { validarArquivo } from './validacao';

describe('lerCsv', () => {
  it('lê com ";" e numera as linhas pelo arquivo (cabeçalho = 1)', () => {
    const r = lerCsv('a;b\r\n1;2\r\n\r\n3;4\r\n');
    expect(r).toEqual([
      { linha: 1, celulas: ['a', 'b'] },
      { linha: 2, celulas: ['1', '2'] },
      { linha: 4, celulas: ['3', '4'] },
    ]);
  });
  it('ignora o BOM e aceita vírgula como separador', () => {
    expect(detectarSeparador('﻿a,b,c\n1,2,3')).toBe(',');
    expect(lerCsv('﻿a,b\n1,2')[0].celulas).toEqual(['a', 'b']);
  });
  it('entende aspas com separador e aspas duplas dentro', () => {
    expect(lerCsv('a;b\n"x;y";"diz ""oi"""')[1].celulas).toEqual(['x;y', 'diz "oi"']);
  });
  it('lê a última linha sem quebra no fim', () => {
    expect(lerCsv('a;b\n1;2')).toHaveLength(2);
  });
});

describe('gerarCsv e gerarModelo', () => {
  it('gera com BOM, ";" e \\r\\n', () => {
    expect(gerarCsv([['a', 'b;c'], ['1', '2']])).toBe('﻿a;"b;c"\r\n1;2\r\n');
  });
  it('o modelo de cada carga tem o cabeçalho e uma linha de exemplo', () => {
    for (const c of CARGAS) {
      const linhas = lerCsv(gerarModelo(c));
      expect(linhas).toHaveLength(2);
      expect(linhas[0].celulas).toEqual(c.colunas.map((x) => x.nome));
      expect(gerarModelo(c).startsWith('﻿')).toBe(true);
    }
  });
  it('a linha de exemplo de cada modelo passa na própria validação', () => {
    for (const c of CARGAS) {
      const texto = gerarModelo(c);
      const r = validarArquivo({ nome: c.arquivoModelo, tamanho: texto.length, texto }, c);
      expect(r).toMatchObject({ ok: true, validas: [expect.any(Object)], problemas: [] });
    }
  });
  it('existem as 6 cargas pedidas', () => {
    expect(CARGAS.map((c) => c.nome)).toEqual(['Exceções por diretoria', 'Férias', 'Feriados', 'Extensões de jornada', 'Feriados por usuário', 'Telefones para WhatsApp']);
    expect(cargaPorId('ferias')?.nome).toBe('Férias');
  });
});
