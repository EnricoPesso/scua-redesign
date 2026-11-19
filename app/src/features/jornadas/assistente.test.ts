import { describe, expect, it } from 'vitest';
import { aplicarNaJornada, CAMPOS_DA_JORNADA } from './assistente';
import type { DadosJornada, HorarioDia } from './domain/tipos';

const util: HorarioDia = { trabalha: true, entrada: '08:00', saida: '17:00', intervaloInicio: '12:00', intervaloFim: '13:00' };
const folga: HorarioDia = { trabalha: false, entrada: '', saida: '', intervaloInicio: '', intervaloFim: '' };
const base = (): DadosJornada => ({
  identificador: '', descricao: '', tipo: '', ativa: true, padrao: false, liberaRegra: false, informativa: false,
  semana: { seg: util, ter: util, qua: util, qui: util, sex: util, sab: folga, dom: folga },
});

describe('aplicarNaJornada', () => {
  it('aplica campos simples e a semana, normalizando horas e maiúsculas', () => {
    const r = aplicarNaJornada(base(), {
      identificador: 'adm-7h', tipo: 'Comercial', informativa: 'sim',
      semana: { seg: { trabalha: true, entrada: '7h', saida: '16:00', intervaloInicio: '11:00', intervaloFim: '12:00' }, sab: { trabalha: true, entrada: '8', saida: '12:00', intervaloInicio: '', intervaloFim: '' }, dom: { trabalha: false } },
      cor: 'azul',
    });
    expect(r.dados.identificador).toBe('ADM-7H');
    expect(r.dados.tipo).toBe('Comercial');
    expect(r.dados.informativa).toBe(true);
    expect(r.dados.semana.seg).toEqual({ trabalha: true, entrada: '07:00', saida: '16:00', intervaloInicio: '11:00', intervaloFim: '12:00' });
    expect(r.dados.semana.sab).toEqual({ trabalha: true, entrada: '08:00', saida: '12:00', intervaloInicio: '', intervaloFim: '' });
    expect(r.dados.semana.dom).toEqual(folga);
    // Dia que a IA não mandou fica como estava.
    expect(r.dados.semana.ter).toEqual(util);
    expect(r.chaves).toEqual(expect.arrayContaining(['identificador', 'tipo', 'informativa', 'semana.seg', 'semana.sab', 'semana.dom']));
    expect(r.chaves).not.toContain('semana.ter');
    expect(r.resultado.ignorados).toEqual([]);
    expect(r.resultado.aplicados.map((a) => a.rotulo)).toEqual(['Identificador', 'Tipo', 'Informativa', 'Horários da semana']);
  });

  it('descreve a semana com horário e intervalo', () => {
    const dia = { trabalha: true, entrada: '08:00', saida: '17:00', intervaloInicio: '12:00', intervaloFim: '13:00' };
    const r = aplicarNaJornada(base(), { semana: { seg: dia, ter: dia, qua: dia, qui: dia, sex: dia, sab: { trabalha: false }, dom: { trabalha: false } } });
    expect(r.resultado.aplicados[0].valor).toMatch(/08:00–17:00/);
    expect(r.resultado.aplicados[0].valor).toMatch(/intervalo 12:00–13:00/);
  });

  it('valor que não serve é ignorado sem mexer nos dados', () => {
    const antes = base();
    const r = aplicarNaJornada(antes, { tipo: 'Noturna', ativa: 'talvez', semana: { ter: 'das 8 às 17', qua: { trabalha: true, entrada: '25:99' }, qui: { trabalha: 'sim' } } });
    expect(r.dados.tipo).toBe('');
    expect(r.dados.ativa).toBe(true);
    expect(r.dados.semana).toEqual(antes.semana);
    expect(r.resultado.ignorados).toEqual(['Tipo', 'Ativa', 'Terça-feira', 'Quarta-feira', 'Quinta-feira']);
    expect(r.resultado.aplicados).toEqual([]);
    expect(r.chaves).toEqual([]);
  });

  it('semana que não é objeto é ignorada; identificador é cortado em 20 caracteres', () => {
    expect(aplicarNaJornada(base(), { semana: 'seg a sex' }).resultado.ignorados).toEqual(['Horários da semana']);
    expect(aplicarNaJornada(base(), { semana: ['seg'] }).resultado.ignorados).toEqual(['Horários da semana']);
    expect(aplicarNaJornada(base(), { identificador: 'x'.repeat(30) }).dados.identificador).toHaveLength(20);
  });

  it('não altera o objeto original', () => {
    const antes = base();
    const copia = structuredClone(antes);
    aplicarNaJornada(antes, { identificador: 'X', semana: { seg: { trabalha: false } } });
    expect(antes).toEqual(copia);
  });

  it('os campos descritos cobrem todos os dados da jornada', () => {
    expect(CAMPOS_DA_JORNADA.map((c) => c.chave).sort()).toEqual(Object.keys(base()).sort());
  });
});
