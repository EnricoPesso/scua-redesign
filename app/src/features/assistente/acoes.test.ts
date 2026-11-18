import { describe, expect, it } from 'vitest';
import type { Permissoes } from '../extensoes/domain/types';
import { aplicarCampos, conferirAcoes, ferramentasPara, FORMULARIOS, formulariosPara, normalizarCampo, rotaPermitida, telasDoContexto } from './acoes';
import type { AlvoFormulario, CampoAlvo } from './contrato';

const usuario = { id: 'u-x', nome: 'Fulano de Tal' } as Permissoes['usuario'];
const admin: Permissoes = { usuario, podePedir: true, podePedirParaOutros: true, podeAprovar: true, podeVerTodos: true, podeVerRelatorios: true, podeGerirPessoas: true, podeAdministrar: true };
const colaborador: Permissoes = { usuario, podePedir: true, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false, podeVerRelatorios: false, podeGerirPessoas: false, podeAdministrar: false };
const rh: Permissoes = { ...colaborador, podeVerRelatorios: true, podeGerirPessoas: true };

const alvo: AlvoFormulario = {
  tipo: 'formulario', id: 'cadastro:pausas', titulo: 'Perfil de pausas', valores: {},
  campos: [{ chave: 'nome', rotulo: 'Nome', tipo: 'texto', maximo: 10 }, { chave: 'minutos', rotulo: 'Duração', tipo: 'numero', minimo: 1, maximo: 60 }],
};

describe('rotaPermitida', () => {
  it('telas do menu, da busca e formulários que a pessoa pode abrir, com os filtros que a tela lê', () => {
    expect(rotaPermitida('/ausencias?de=2026-10-11&ate=2026-10-11', admin)).toBe(true);
    expect(rotaPermitida('/relatorios/tempo-de-bloqueio', admin)).toBe(true);
    expect(rotaPermitida('/relatorios/tempo-de-bloqueio?inicio=2026-10-01&fim=2026-10-12', admin)).toBe(true);
    expect(rotaPermitida('/configuracoes/grupos', admin)).toBe(true);
    expect(rotaPermitida('/jornadas/nova', admin)).toBe(true);
    expect(rotaPermitida('/pausas?novo=1', rh)).toBe(true);
    expect(rotaPermitida('/inicio?periodo=7dias', rh)).toBe(true);
  });

  it('recusa tela sem permissão, filtro desconhecido e qualquer coisa que não seja caminho interno', () => {
    expect(rotaPermitida('/auditoria', colaborador)).toBe(false);
    expect(rotaPermitida('/auditoria', rh)).toBe(false);
    expect(rotaPermitida('/configuracoes/grupos', rh)).toBe(false);
    expect(rotaPermitida('/jornadas/nova', colaborador)).toBe(false);
    expect(rotaPermitida('/ausencias?perigo=1', admin)).toBe(false);
    expect(rotaPermitida('/pausas?novo=2', admin)).toBe(false);
    expect(rotaPermitida('/usuarios/u-ana', admin)).toBe(false);
    expect(rotaPermitida('https://exemplo.com', admin)).toBe(false);
    expect(rotaPermitida('//exemplo.com', admin)).toBe(false);
    expect(rotaPermitida('/\\exemplo.com', admin)).toBe(false);
    expect(rotaPermitida('javascript:alert(1)', admin)).toBe(false);
    expect(rotaPermitida('/ausencias/../auditoria', rh)).toBe(false);
  });
});

describe('formulários e ferramentas por permissão', () => {
  it('quem não gere pessoas não tem formulários; RH tem os de pessoas; administrador tem todos', () => {
    expect(formulariosPara(colaborador)).toEqual([]);
    const doRh = formulariosPara(rh).map((f) => f.id);
    expect(doRh).toEqual(expect.arrayContaining(['jornada', 'cadastro:pausas', 'cadastro:liberacoes']));
    expect(doRh).not.toContain('cadastro:grupos');
    expect(formulariosPara(admin).map((f) => f.id)).toContain('cadastro:grupos');
    expect(formulariosPara(admin)).toHaveLength(FORMULARIOS.length);
  });

  it('cadastros que não permitem criar ficam fora', () => {
    const ids = FORMULARIOS.map((f) => f.id);
    expect(ids).not.toContain('cadastro:parametros');
    expect(ids).not.toContain('cadastro:mensagens');
    expect(ids).not.toContain('cadastro:notificacoes');
  });

  it('ferramentas oferecidas', () => {
    expect(ferramentasPara(colaborador, null)).toEqual(['navegar']);
    expect(ferramentasPara(admin, null)).toEqual(['navegar', 'abrir_formulario']);
    expect(ferramentasPara(admin, alvo)).toEqual(['preencher_formulario', 'navegar', 'abrir_formulario']);
  });

  it('as telas do contexto incluem as rotas dos formulários permitidos', () => {
    const rotas = telasDoContexto(rh).map((t) => t.para);
    expect(rotas).toContain('/ausencias');
    expect(rotas).toContain('/jornadas/nova');
    expect(rotas).not.toContain('/auditoria');
    expect(telasDoContexto(colaborador).map((t) => t.para)).not.toContain('/jornadas/nova');
  });
});

describe('conferirAcoes', () => {
  it('preencher sem formulário aberto é recusado', () => {
    const r = conferirAcoes([{ tipo: 'preencher', campos: { nome: 'X' } }], { permissoes: admin, alvo: null });
    expect(r.validas).toEqual([]);
    expect(r.recusadas).toHaveLength(1);
  });

  it('preencher: chave que não existe some, as outras ficam; nenhuma válida = recusado', () => {
    const r = conferirAcoes([{ tipo: 'preencher', campos: { nome: 'X', __proto__x: 1, senha: 'a' } }], { permissoes: admin, alvo });
    expect(r.validas).toEqual([{ tipo: 'preencher', campos: { nome: 'X' } }]);
    expect(conferirAcoes([{ tipo: 'preencher', campos: { senha: 'a' } }], { permissoes: admin, alvo }).validas).toEqual([]);
  });

  it('navegar e abrir_formulario seguem as permissões', () => {
    const ctx = { permissoes: rh, alvo: null };
    expect(conferirAcoes([{ tipo: 'navegar', rota: '/auditoria' }], ctx)).toMatchObject({ validas: [], recusadas: [expect.any(String)] });
    expect(conferirAcoes([{ tipo: 'navegar', rota: '/ausencias' }], ctx).validas).toHaveLength(1);
    expect(conferirAcoes([{ tipo: 'abrir_formulario', formulario: 'cadastro:grupos' }], ctx).validas).toEqual([]);
    expect(conferirAcoes([{ tipo: 'abrir_formulario', formulario: 'inexistente' }], { permissoes: admin, alvo: null }).validas).toEqual([]);
    expect(conferirAcoes([{ tipo: 'abrir_formulario', formulario: 'jornada' }], ctx).validas).toHaveLength(1);
  });

  it('ação de tipo desconhecido é recusada', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(conferirAcoes([{ tipo: 'excluir', id: 'x' } as any], { permissoes: admin, alvo }).validas).toEqual([]);
  });
});

describe('normalizarCampo', () => {
  const campo = (c: Partial<CampoAlvo> & Pick<CampoAlvo, 'tipo'>): CampoAlvo => ({ chave: 'c', rotulo: 'C', ...c });
  it('hora', () => {
    expect(normalizarCampo(campo({ tipo: 'hora' }), '8h')).toEqual({ ok: true, valor: '08:00' });
    expect(normalizarCampo(campo({ tipo: 'hora' }), '8:5')).toEqual({ ok: true, valor: '08:05' });
    expect(normalizarCampo(campo({ tipo: 'hora' }), '17:30')).toEqual({ ok: true, valor: '17:30' });
    expect(normalizarCampo(campo({ tipo: 'hora' }), '')).toEqual({ ok: true, valor: '' });
    expect(normalizarCampo(campo({ tipo: 'hora' }), '25:00')).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'hora' }), 8)).toEqual({ ok: false });
  });
  it('número com limites', () => {
    expect(normalizarCampo(campo({ tipo: 'numero', maximo: 60 }), '15')).toEqual({ ok: true, valor: 15 });
    expect(normalizarCampo(campo({ tipo: 'numero', maximo: 60 }), 61)).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'numero', minimo: 1 }), 0)).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'numero' }), 'abc')).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'numero' }), Number.NaN)).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'numero' }), '7,5')).toEqual({ ok: true, valor: 7.5 });
  });
  it('select por valor ou rótulo, alternar, data e texto', () => {
    const sel = campo({ tipo: 'select', opcoes: [{ value: 'com', label: 'Comercial' }] });
    expect(normalizarCampo(sel, 'Comercial')).toEqual({ ok: true, valor: 'com' });
    expect(normalizarCampo(sel, 'com')).toEqual({ ok: true, valor: 'com' });
    expect(normalizarCampo(sel, 'Noturna')).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'alternar' }), 'sim')).toEqual({ ok: true, valor: true });
    expect(normalizarCampo(campo({ tipo: 'alternar' }), false)).toEqual({ ok: true, valor: false });
    expect(normalizarCampo(campo({ tipo: 'alternar' }), 'talvez')).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'data' }), '2026-10-12')).toEqual({ ok: true, valor: '2026-10-12' });
    expect(normalizarCampo(campo({ tipo: 'data' }), '12/10/2026')).toEqual({ ok: true, valor: '2026-10-12' });
    expect(normalizarCampo(campo({ tipo: 'data' }), '2026-02-31')).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'texto', maximo: 5 }), 'abcdefgh')).toEqual({ ok: true, valor: 'abcde' });
    expect(normalizarCampo(campo({ tipo: 'texto' }), { a: 1 })).toEqual({ ok: false });
    expect(normalizarCampo(campo({ tipo: 'texto' }), 12)).toEqual({ ok: true, valor: '12' });
  });
});

describe('aplicarCampos', () => {
  it('separa o que vale do que não vale e descreve em texto', () => {
    const r = aplicarCampos(alvo.campos, { nome: 'Café', minutos: 99, cor: 'azul' });
    expect(r.validos).toEqual({ nome: 'Café' });
    expect(r.resultado.aplicados).toEqual([{ rotulo: 'Nome', valor: 'Café' }]);
    expect(r.resultado.ignorados).toEqual(['Duração']);
  });
});
