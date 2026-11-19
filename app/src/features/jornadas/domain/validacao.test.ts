import { describe, expect, it } from 'vitest';
import { DIAS, type DadosJornada, type HorarioDia } from './tipos';
import { temErros, validarDia, validarJornada } from './validacao';

const folga: HorarioDia = { trabalha: false, entrada: '', saida: '', intervaloInicio: '', intervaloFim: '' };
const util: HorarioDia = { trabalha: true, entrada: '08:00', saida: '17:00', intervaloInicio: '12:00', intervaloFim: '13:00' };
const valida = (): DadosJornada => ({
  identificador: 'NOVA-8H', descricao: 'Nova jornada', tipo: 'Administrativa', ativa: true, padrao: false, liberaRegra: false, informativa: false,
  semana: Object.fromEntries(DIAS.map((d) => [d, d === 'sab' || d === 'dom' ? folga : util])) as DadosJornada['semana'],
});
const outras = [{ id: 'a', identificador: 'ADM-8H' }];

describe('validarDia', () => {
  it('aceita um dia completo', () => expect(validarDia(util)).toEqual({}));
  it('ignora dia de folga mesmo com horário inválido', () => expect(validarDia({ ...folga, entrada: '17:00', saida: '08:00' })).toEqual({}));
  it('pede entrada e saída', () => expect(validarDia({ ...util, entrada: '', saida: '' })).toMatchObject({ entrada: 'Informe a entrada', saida: 'Informe a saída' }));
  it('saída precisa ser depois da entrada', () => expect(validarDia({ ...util, saida: '07:00' }).saida).toBe('A saída precisa ser depois da entrada'));
  it('saída igual à entrada também não vale', () => expect(validarDia({ ...util, saida: '08:00' }).saida).toBeDefined());
  it('intervalo sem fim ou sem início', () => {
    expect(validarDia({ ...util, intervaloFim: '' }).intervaloFim).toBe('Informe o fim do intervalo');
    expect(validarDia({ ...util, intervaloInicio: '' }).intervaloInicio).toBe('Informe o início do intervalo');
  });
  it('fim do intervalo depois do início', () => expect(validarDia({ ...util, intervaloInicio: '13:00', intervaloFim: '12:00' }).intervaloFim).toBe('O fim precisa ser depois do início'));
  it('intervalo dentro do expediente', () => {
    expect(validarDia({ ...util, intervaloInicio: '07:00', intervaloFim: '08:30' }).intervaloFim).toBe('O intervalo precisa ficar dentro do expediente');
    expect(validarDia({ ...util, intervaloInicio: '16:30', intervaloFim: '17:30' }).intervaloFim).toBe('O intervalo precisa ficar dentro do expediente');
  });
  it('o intervalo é opcional', () => expect(validarDia({ ...util, intervaloInicio: '', intervaloFim: '' })).toEqual({}));
});

describe('validarJornada', () => {
  it('aceita uma jornada correta', () => expect(temErros(validarJornada(valida(), outras))).toBe(false));

  it('identificador obrigatório, em formato válido e único', () => {
    expect(validarJornada({ ...valida(), identificador: ' ' }, outras).identificador).toBe('Informe o identificador');
    expect(validarJornada({ ...valida(), identificador: 'com espaço' }, outras).identificador).toMatch(/letras, números/);
    expect(validarJornada({ ...valida(), identificador: 'adm-8h' }, outras).identificador).toBe('Já existe uma jornada com este identificador');
  });

  it('editar a própria jornada não conta como repetição', () => {
    expect(validarJornada({ ...valida(), identificador: 'ADM-8H' }, outras, 'a').identificador).toBeUndefined();
  });

  it('pede pelo menos um dia de trabalho', () => {
    const d = valida();
    for (const dia of DIAS) d.semana[dia] = folga;
    expect(validarJornada(d, outras).semana).toBe('Marque pelo menos um dia de trabalho');
  });

  it('aponta o dia com problema', () => {
    const d = valida();
    d.semana.qua = { ...util, saida: '07:00' };
    const erros = validarJornada(d, outras);
    expect(Object.keys(erros.dias)).toEqual(['qua']);
    expect(erros.dias.qua?.saida).toBeDefined();
  });

  it('a jornada padrão precisa estar ativa', () => {
    expect(validarJornada({ ...valida(), padrao: true, ativa: false }, outras).padrao).toBe('A jornada padrão precisa estar ativa');
  });
});
