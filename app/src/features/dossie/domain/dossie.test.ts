import { describe, expect, it } from 'vitest';
import { dia } from '../../../mock/datas';
import { pessoaPorId } from '../../../mock/diretorio';
import { diasDaPessoa } from '../../../mock/jornadaReal';
import {
  barraDoDia, codigoDeIntegridade, formaCanonica, montarConteudo, montarDossie, textoDaBarra,
  type DiaDoDossie,
} from './dossie';

const ana = pessoaPorId('u-ana')!;
const de = dia(-30);
const ate = dia(-1);
const dias = () => diasDaPessoa('u-ana', -31, -1);

const diaBase: DiaDoDossie = {
  dia: '2026-10-09', diaDaSemana: 5, previstoInicio: '08:00', previstoFim: '17:00', intervaloPrevistoMin: 60,
  primeiroLogon: '08:00', ultimoLogoff: '17:00', intervaloRealMin: 60, extraAprovadaMin: 0, extraSemAprovacaoMin: 0,
  tentativasBloqueadas: 0, pausasPrevistas: 2, pausasFeitas: 2, ocorrencias: [],
};

describe('montarConteudo', () => {
  const c = montarConteudo(ana, dias(), de, ate);

  it('identifica a pessoa e traz os dias do período, do mais recente ao mais antigo', () => {
    expect(c.pessoa).toMatchObject({ id: 'u-ana', nome: 'Ana Souza', matricula: '1002', gestor: 'Carlos Mendes', estacao: 'SCUA-NB-021' });
    expect(c.dias).toHaveLength(30);
    expect(c.dias[0].dia).toBe(ate);
    expect(c.dias[29].dia).toBe(de);
  });

  it('o dia de referência anterior ao período não entra, mas serve para a interjornada', () => {
    expect(c.dias.some((d) => d.dia < de)).toBe(false);
  });

  it('o resumo soma os dias', () => {
    const r = c.resumo;
    expect(r.diasNoPeriodo).toBe(30);
    expect(r.diasComUso).toBe(c.dias.filter((d) => d.primeiroLogon).length);
    expect(r.extraAprovadaMin).toBe(c.dias.reduce((t, d) => t + d.extraAprovadaMin, 0));
    expect(r.tentativasBloqueadas).toBe(c.dias.reduce((t, d) => t + d.tentativasBloqueadas, 0));
    expect(r.pausasFeitas).toBeLessThanOrEqual(r.pausasPrevistas);
    expect(r.totalOcorrencias).toBe(Object.values(r.ocorrenciasPorRegra).reduce((t, n) => t + n, 0));
    expect(r.totalOcorrencias).toBe(c.dias.reduce((t, d) => t + d.ocorrencias.length, 0));
  });

  it('cada ocorrência traz título e base legal', () => {
    const com = c.dias.find((d) => d.ocorrencias.length > 0);
    expect(com).toBeDefined();
    for (const o of com!.ocorrencias) {
      expect(o.titulo.length).toBeGreaterThan(0);
      expect(o.base).toMatch(/CLT|Súmula/);
    }
  });

  it('um período menor dá menos dias', () => {
    expect(montarConteudo(ana, dias(), dia(-7), ate).dias).toHaveLength(7);
  });
});

describe('código de integridade', () => {
  it('é um SHA-256 em hexadecimal e é o mesmo para o mesmo conteúdo', async () => {
    const a = await codigoDeIntegridade(montarConteudo(ana, dias(), de, ate));
    const b = await codigoDeIntegridade(montarConteudo(ana, dias(), de, ate));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
  });

  it('muda quando qualquer informação muda', async () => {
    const original = montarConteudo(ana, dias(), de, ate);
    const base = await codigoDeIntegridade(original);
    const alterado = structuredClone(original);
    alterado.dias[3].ultimoLogoff = '23:59';
    expect(await codigoDeIntegridade(alterado)).not.toBe(base);
    const outraPessoa = structuredClone(original);
    outraPessoa.pessoa.matricula = '9999';
    expect(await codigoDeIntegridade(outraPessoa)).not.toBe(base);
  });

  it('não depende da ordem das chaves nem da data de geração', async () => {
    expect(formaCanonica({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: null } })).toBe(formaCanonica({ a: { c: null, d: [2, { y: 2, z: 1 }] }, b: 1 }));
    const x = await montarDossie(ana, dias(), de, ate, '2026-10-12T10:00:00.000Z');
    const y = await montarDossie(ana, dias(), de, ate, '2026-10-12T11:30:00.000Z');
    expect(x.codigo).toBe(y.codigo);
  });
});

describe('barra do dia', () => {
  it('dia dentro da jornada: só faixa normal', () => {
    const b = barraDoDia(diaBase);
    expect(b.previsto).not.toBeNull();
    expect(b.faixas.map((f) => f.tipo)).toEqual(['normal']);
  });

  it('hora extra aprovada e sem aprovação aparecem depois da jornada, nessa ordem', () => {
    const b = barraDoDia({ ...diaBase, ultimoLogoff: '19:30', extraAprovadaMin: 60, extraSemAprovacaoMin: 90 });
    expect(b.faixas.map((f) => f.tipo)).toEqual(['normal', 'extraAprovada', 'extraSemAprovacao']);
    const [, aprovada, sem] = b.faixas;
    expect(aprovada.esquerda + aprovada.largura).toBeCloseTo(sem.esquerda, 1);
  });

  it('sem jornada prevista, todo o uso é sem aprovação; sem uso, não há faixas', () => {
    const fds = barraDoDia({ ...diaBase, previstoInicio: null, previstoFim: null, primeiroLogon: '09:00', ultimoLogoff: '11:00' });
    expect(fds.previsto).toBeNull();
    expect(fds.faixas.map((f) => f.tipo)).toEqual(['extraSemAprovacao']);
    expect(barraDoDia({ ...diaBase, primeiroLogon: null, ultimoLogoff: null }).faixas).toEqual([]);
  });

  it('o texto alternativo conta o dia em palavras', () => {
    expect(textoDaBarra({ ...diaBase, ultimoLogoff: '19:00', extraAprovadaMin: 60, extraSemAprovacaoMin: 60 })).toBe(
      'Jornada prevista das 08:00 às 17:00. Estação usada das 08:00 às 19:00. 2h além da jornada, sendo 1h sem aprovação.',
    );
    expect(textoDaBarra({ ...diaBase, primeiroLogon: null, ultimoLogoff: null })).toContain('Sem uso da estação.');
  });
});
