import { describe, expect, it } from 'vitest';
import type { DadosUsuario } from './tipos';
import { periodosSeSobrepoem, validarDados, validarExcecao, validarFerias, validarSubstituto, whatsappValido } from './validacao';

const ANO = '2026';

describe('periodosSeSobrepoem', () => {
  const base = { inicio: '2026-11-10', fim: '2026-11-20' };
  it('períodos separados não se sobrepõem', () => {
    expect(periodosSeSobrepoem(base, { inicio: '2026-11-21', fim: '2026-11-30' })).toBe(false);
    expect(periodosSeSobrepoem(base, { inicio: '2026-10-01', fim: '2026-11-09' })).toBe(false);
  });
  it('tocar no mesmo dia já é sobreposição', () => {
    expect(periodosSeSobrepoem(base, { inicio: '2026-11-20', fim: '2026-11-25' })).toBe(true);
    expect(periodosSeSobrepoem(base, { inicio: '2026-11-01', fim: '2026-11-10' })).toBe(true);
  });
  it('um período dentro do outro, ou cobrindo o outro, se sobrepõe', () => {
    expect(periodosSeSobrepoem(base, { inicio: '2026-11-12', fim: '2026-11-13' })).toBe(true);
    expect(periodosSeSobrepoem(base, { inicio: '2026-11-01', fim: '2026-12-01' })).toBe(true);
  });
  it('é simétrica', () => {
    const outro = { inicio: '2026-11-15', fim: '2026-12-01' };
    expect(periodosSeSobrepoem(base, outro)).toBe(periodosSeSobrepoem(outro, base));
  });
});

describe('validarFerias', () => {
  const existentes = [{ id: 'f1', inicio: '2026-11-10', fim: '2026-11-20' }];
  it('aceita um período livre', () => expect(validarFerias({ inicio: '2026-11-21', fim: '2026-11-30' }, existentes, ANO)).toEqual({}));
  it('aceita um dia só (fim igual ao início)', () => expect(validarFerias({ inicio: '2026-12-01', fim: '2026-12-01' }, existentes, ANO)).toEqual({}));
  it('pede as duas datas', () => expect(validarFerias({ inicio: '', fim: '' }, [], ANO)).toEqual({ inicio: 'Informe o início', fim: 'Informe o fim' }));
  it('fim antes do início', () => expect(validarFerias({ inicio: '2026-12-10', fim: '2026-12-01' }, [], ANO).fim).toBe('O fim não pode ser antes do início'));
  it('avisa qual período colide', () => {
    expect(validarFerias({ inicio: '2026-11-18', fim: '2026-11-25' }, existentes, ANO).inicio).toBe('Este período se sobrepõe às férias de 10/11 a 20/11');
  });
});

describe('validarExcecao', () => {
  const valida = { data: '2026-10-14', entrada: '10:00', saida: '16:00', motivo: 'Consulta' };
  const hoje = '2026-10-12';
  it('aceita uma exceção correta, inclusive hoje', () => {
    expect(validarExcecao(valida, [], hoje)).toEqual({});
    expect(validarExcecao({ ...valida, data: hoje }, [], hoje)).toEqual({});
  });
  it('a data não pode ser passada', () => expect(validarExcecao({ ...valida, data: '2026-10-11' }, [], hoje).data).toBe('A data não pode ser anterior a hoje'));
  it('a saída precisa ser depois da entrada', () => {
    expect(validarExcecao({ ...valida, saida: '09:00' }, [], hoje).saida).toBe('A saída precisa ser depois da entrada');
    expect(validarExcecao({ ...valida, saida: '10:00' }, [], hoje).saida).toBeDefined();
  });
  it('motivo é obrigatório e espaços não contam', () => expect(validarExcecao({ ...valida, motivo: '   ' }, [], hoje).motivo).toBe('Informe o motivo'));
  it('pede data e horários', () => expect(validarExcecao({ data: '', entrada: '', saida: '', motivo: 'x' }, [], hoje)).toEqual({ data: 'Informe a data', entrada: 'Informe a entrada', saida: 'Informe a saída' }));
  it('não repete a data de outra exceção', () => {
    expect(validarExcecao(valida, [{ id: 'e1', ...valida }], hoje).data).toBe('Já existe uma exceção nesta data');
  });
});

describe('validarSubstituto', () => {
  it('aceita pessoa e período corretos', () => expect(validarSubstituto({ pessoaId: 'u-olga', de: '2026-10-20', ate: '2026-10-31' }, 'u-carlos')).toEqual({}));
  it('a pessoa não pode ser a própria substituta', () => expect(validarSubstituto({ pessoaId: 'u-carlos', de: '2026-10-20', ate: '2026-10-31' }, 'u-carlos').pessoaId).toBeDefined());
  it('fim antes do início', () => expect(validarSubstituto({ pessoaId: 'u-olga', de: '2026-10-20', ate: '2026-10-19' }, 'u-carlos').ate).toBe('O fim não pode ser antes do início'));
  it('pede pessoa e datas', () => expect(validarSubstituto({ pessoaId: '', de: '', ate: '' }, 'u-carlos')).toEqual({ pessoaId: 'Escolha quem aprova no lugar', de: 'Informe o início', ate: 'Informe o fim' }));
  it('mesmo dia de início e fim vale', () => expect(validarSubstituto({ pessoaId: 'u-olga', de: '2026-10-20', ate: '2026-10-20' }, 'u-carlos')).toEqual({}));
});

describe('whatsappValido', () => {
  it('aceita formatos comuns com DDD', () => {
    for (const t of ['(11) 91234-5678', '11912345678', '+55 11 91234-5678', '(11) 3123-4567']) expect(whatsappValido(t)).toBe(true);
  });
  it('rejeita letras e números curtos ou longos demais', () => {
    for (const t of ['abc', '12345', '(11) 9123-ab45', '1234567890123456']) expect(whatsappValido(t)).toBe(false);
  });
});

describe('validarDados', () => {
  const ok: DadosUsuario = {
    email: 'ana@scua.com.br', whatsapp: '', gestorId: 'u-carlos', departamento: 'Vendas', jornadaId: 'jor-adm-8h',
    permissoes: { avisosPorEmail: true, liberaRegra: false, administrador: false, rhAprovador: false, sustentacao: false, producao: false },
  };
  it('aceita dados corretos, com WhatsApp opcional', () => expect(validarDados(ok)).toEqual({}));
  it('e-mail obrigatório e em formato válido', () => {
    expect(validarDados({ ...ok, email: ' ' }).email).toBe('Informe o e-mail');
    expect(validarDados({ ...ok, email: 'ana@' }).email).toMatch(/e-mail válido/);
  });
  it('WhatsApp preenchido precisa ser válido', () => expect(validarDados({ ...ok, whatsapp: 'oi' }).whatsapp).toMatch(/com DDD/));
  it('departamento e jornada obrigatórios', () => {
    const e = validarDados({ ...ok, departamento: '', jornadaId: '' });
    expect(e.departamento).toBeDefined();
    expect(e.jornadaId).toBeDefined();
  });
});
