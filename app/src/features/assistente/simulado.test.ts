import { describe, expect, it, vi } from 'vitest';
import { ErroDoAssistente, perguntar, perguntarNoServidor } from './api';
import type { AlvoFormulario, AlvoRelatorio, ContextoTela, NomeFerramenta, PedidoAssistente } from './contrato';
import { interpretarJornada, responderSimulado } from './simulado';

const contexto: ContextoTela = {
  rota: '/inicio', pessoa: 'Carlos', hoje: '2026-10-12',
  telas: [{ titulo: 'Ausências', para: '/ausencias' }, { titulo: 'Auditoria', para: '/auditoria' }, { titulo: 'Tempo de bloqueio', para: '/relatorios/tempo-de-bloqueio' }, { titulo: 'Jornadas de trabalho', para: '/jornadas' }],
  formularios: [{ id: 'jornada', titulo: 'Jornada de trabalho' }, { id: 'cadastro:pausas', titulo: 'Pausa' }],
  alvo: null,
};
const TODAS: NomeFerramenta[] = ['preencher_formulario', 'navegar', 'abrir_formulario'];
const pedido = (texto: string, extra: Partial<ContextoTela> = {}, ferramentas: NomeFerramenta[] = TODAS): PedidoAssistente =>
  ({ mensagens: [{ papel: 'usuario', texto }], contexto: { ...contexto, ...extra }, ferramentas });

const jornada: AlvoFormulario = { tipo: 'formulario', id: 'jornada', titulo: 'Jornada de trabalho', campos: [{ chave: 'identificador', rotulo: 'Identificador', tipo: 'texto' }, { chave: 'semana', rotulo: 'Semana', tipo: 'semana' }], valores: {} };
const pausa: AlvoFormulario = {
  tipo: 'formulario', id: 'cadastro:pausas', titulo: 'Pausa', valores: {},
  campos: [
    { chave: 'nome', rotulo: 'Nome', tipo: 'texto' },
    { chave: 'minutos', rotulo: 'Duração', tipo: 'numero' },
    { chave: 'ativo', rotulo: 'Ativa', tipo: 'alternar' },
    { chave: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: [{ value: 'cafe', label: 'Café' }, { value: 'medica', label: 'Médica' }] },
    { chave: 'inicio', rotulo: 'Início', tipo: 'hora' },
  ],
};
const relatorio: AlvoRelatorio = {
  tipo: 'relatorio', titulo: 'Tempo de bloqueio', filtros: { Período: 'de 06/10 a 12/10' },
  indicadores: [{ rotulo: 'Bloqueios liberados', valor: '4' }, { rotulo: 'Tempo médio', valor: '18 min' }],
  colunas: ['Colaborador', 'Minutos'],
  linhas: [['Ana Souza', '30'], ['Bia Rocha', '25'], ['Rui Alves', '12'], ['João Lima', '9'], ['Olga Prado', '4']],
  totalDeLinhas: 5,
};

describe('interpretarJornada', () => {
  it('jornada do exemplo da spec', () => {
    const j = interpretarJornada('seg a sex, 8h às 17h, almoço 12 às 13, nome ADM-8H');
    expect(j.identificador).toBe('ADM-8H');
    expect(j.semana?.seg).toEqual({ trabalha: true, entrada: '08:00', saida: '17:00', intervaloInicio: '12:00', intervaloFim: '13:00' });
    expect(j.semana?.sex.saida).toBe('17:00');
    expect(j.semana?.sab.trabalha).toBe(false);
    expect(j.semana?.dom.trabalha).toBe(false);
  });

  it('lista de dias, meia hora e sem intervalo', () => {
    const j = interpretarJornada('seg, qua e sex das 07:30 às 13:30 sem intervalo');
    expect(j.semana?.qua).toMatchObject({ trabalha: true, entrada: '07:30', saida: '13:30', intervaloInicio: '', intervaloFim: '' });
    expect(j.semana?.seg.trabalha).toBe(true);
    expect(j.semana?.ter.trabalha).toBe(false);
    expect(j.semana?.qui.trabalha).toBe(false);
  });

  it('nomes por extenso, "até", "7h30" e intervalo escrito antes do horário', () => {
    const j = interpretarJornada('Intervalo das 11h30 às 12h30. Segunda até sábado, das 7h30 às 16h. Identificador: turno-a, tipo Turno');
    expect(j.identificador).toBe('TURNO-A');
    expect(j.tipo).toBe('Turno');
    expect(j.semana?.sab).toEqual({ trabalha: true, entrada: '07:30', saida: '16:00', intervaloInicio: '11:30', intervaloFim: '12:30' });
    expect(j.semana?.dom.trabalha).toBe(false);
  });

  it('"todos os dias" liga os sete; sem citar dias, vale para os dias úteis', () => {
    expect(interpretarJornada('todos os dias das 6 às 14').semana?.dom.trabalha).toBe(true);
    const j = interpretarJornada('das 9 às 18');
    expect(j.semana?.sex.trabalha).toBe(true);
    expect(j.semana?.sab.trabalha).toBe(false);
  });

  it('texto sem horário não inventa nada; hora impossível é ignorada', () => {
    expect(interpretarJornada('oi tudo bem')).toEqual({});
    expect(interpretarJornada('seg a sex das 25 às 99')).toEqual({});
    expect(interpretarJornada('preciso ter uma conversa')).toEqual({});
  });
});

describe('responderSimulado', () => {
  it('formulário de jornada aberto: devolve a ação de preencher', () => {
    const r = responderSimulado(pedido('seg a sex, 8h às 17h, almoço 12 às 13, nome ADM-8H', { alvo: jornada }));
    expect(r.simulado).toBe(true);
    expect(r.acoes).toHaveLength(1);
    expect(r.acoes[0]).toMatchObject({ tipo: 'preencher', campos: { identificador: 'ADM-8H' } });
  });

  it('cadastro genérico: lê "rótulo: valor" de cada tipo de campo', () => {
    const r = responderSimulado(pedido('nome: Café da tarde, duração 15, ativa: sim, tipo: médica, início 9h30', { alvo: pausa }));
    expect(r.acoes).toEqual([{ tipo: 'preencher', campos: { nome: 'Café da tarde', minutos: 15, ativo: true, tipo: 'medica', inicio: '09:30' } }]);
  });

  it('formulário aberto mas nada reconhecido: explica como pedir, sem ação', () => {
    const r = responderSimulado(pedido('preenche aí pra mim', { alvo: pausa }));
    expect(r.acoes).toEqual([]);
    expect(r.texto).toMatch(/Nome/);
  });

  it('sem formulário aberto, pedido de cadastro abre o formulário certo', () => {
    expect(responderSimulado(pedido('cria uma jornada seg a sex 8 às 17')).acoes).toEqual([{ tipo: 'abrir_formulario', formulario: 'jornada' }]);
    expect(responderSimulado(pedido('cadastra uma pausa nome: Lanche')).acoes).toEqual([{ tipo: 'abrir_formulario', formulario: 'cadastro:pausas' }]);
  });

  it('escolhe o cadastro pela primeira coisa citada, não pela quantidade de palavras em comum', () => {
    const formularios = [{ id: 'cadastro:tipos-de-jornada', titulo: 'Tipos de jornada' }, { id: 'jornada', titulo: 'Jornada de trabalho' }, { id: 'cadastro:grupos', titulo: 'Grupos' }];
    expect(responderSimulado(pedido('cria uma jornada seg a sex, 8h às 17h, nome COM-8H, tipo Comercial', { formularios })).acoes).toEqual([{ tipo: 'abrir_formulario', formulario: 'jornada' }]);
    expect(responderSimulado(pedido('cria um tipo de jornada chamado Noturno', { formularios })).acoes).toEqual([{ tipo: 'abrir_formulario', formulario: 'cadastro:tipos-de-jornada' }]);
    expect(responderSimulado(pedido('adiciona um grupo novo', { formularios })).acoes).toEqual([{ tipo: 'abrir_formulario', formulario: 'cadastro:grupos' }]);
  });

  it('acha o cadastro por qualquer palavra do título ("cria uma pausa" é um Perfil de pausas)', () => {
    const formularios = [{ id: 'jornada', titulo: 'Jornada de trabalho' }, { id: 'cadastro:pausas', titulo: 'Perfil de pausas' }];
    expect(responderSimulado(pedido('cria uma pausa nome: Lanche', { formularios })).acoes).toEqual([{ tipo: 'abrir_formulario', formulario: 'cadastro:pausas' }]);
  });

  it('quem não pode cadastrar recebe a explicação, sem ação', () => {
    const r = responderSimulado(pedido('cria uma jornada seg a sex 8 às 17', { formularios: [] }, ['navegar']));
    expect(r.acoes).toEqual([]);
    expect(r.texto).toMatch(/acesso/i);
  });

  it('relatório aberto: resume com título, total, indicadores e primeiras linhas', () => {
    const r = responderSimulado(pedido('analisa esse relatório', { alvo: relatorio }));
    expect(r.acoes).toEqual([]);
    expect(r.texto).toContain('Tempo de bloqueio');
    expect(r.texto).toContain('5 linhas');
    expect(r.texto).toContain('Bloqueios liberados: 4');
    expect(r.texto).toContain('Tempo médio: 18 min');
    expect(r.texto).toContain('Ana Souza');
    expect(r.texto).not.toContain('Olga Prado');
  });

  it('relatório sem linhas', () => {
    const r = responderSimulado(pedido('resume pra mim', { alvo: { ...relatorio, linhas: [], totalDeLinhas: 0 } }));
    expect(r.texto).toContain('Não há dados com esses filtros.');
  });

  it('navegação: tela pelo nome; "ontem" e "hoje" viram filtro em Ausências', () => {
    expect(responderSimulado(pedido('me leva para ausências de ontem')).acoes).toEqual([{ tipo: 'navegar', rota: '/ausencias?de=2026-10-11&ate=2026-10-11' }]);
    expect(responderSimulado(pedido('abre ausências de hoje')).acoes).toEqual([{ tipo: 'navegar', rota: '/ausencias?de=2026-10-12&ate=2026-10-12' }]);
    expect(responderSimulado(pedido('ir para tempo de bloqueio')).acoes).toEqual([{ tipo: 'navegar', rota: '/relatorios/tempo-de-bloqueio' }]);
  });

  it('navegação para tela que a pessoa não tem: explica, sem ação', () => {
    const r = responderSimulado(pedido('me leva para auditoria', { telas: [{ titulo: 'Ausências', para: '/ausencias' }] }));
    expect(r.acoes).toEqual([]);
    expect(r.texto).toMatch(/não encontrei|acesso/i);
  });

  it('dúvida de uso e pedido fora do sistema', () => {
    const duvida = responderSimulado(pedido('como aprovo uma extensão?'));
    expect(duvida.acoes).toEqual([]);
    expect(duvida.texto).toContain('Extensões de jornada');
    const fora = responderSimulado(pedido('qual a capital da França?'));
    expect(fora.texto).toMatch(/^Só consigo ajudar com o Scua Logon/);
    expect(fora.acoes).toEqual([]);
  });
});

describe('perguntar', () => {
  it('em teste, responde pelo modo simulado sem chamar a rede', async () => {
    const espia = vi.spyOn(globalThis, 'fetch');
    const r = await perguntar(pedido('oi', {}, []));
    expect(r.simulado).toBe(true);
    expect(espia).not.toHaveBeenCalled();
    espia.mockRestore();
  });
});

describe('perguntarNoServidor', () => {
  const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });
  const p = pedido('oi', {}, []);

  it('sem IA conectada: devolve null e não faz o POST (nada de erro no console)', async () => {
    const buscar = vi.fn().mockResolvedValue(json({ ativo: false, provedor: null }));
    expect(await perguntarNoServidor(p, buscar)).toBeNull();
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar.mock.calls[0][0]).toBe('/api/assistente/estado');
  });

  it('com IA conectada: faz o POST e devolve texto e ações', async () => {
    const buscar = vi.fn()
      .mockResolvedValueOnce(json({ ativo: true, provedor: 'anthropic' }))
      .mockResolvedValueOnce(json({ texto: 'Olá', acoes: [{ tipo: 'navegar', rota: '/ausencias' }] }));
    expect(await perguntarNoServidor(p, buscar)).toEqual({ texto: 'Olá', acoes: [{ tipo: 'navegar', rota: '/ausencias' }] });
    expect(buscar.mock.calls[1][0]).toBe('/api/assistente');
    expect(JSON.parse(buscar.mock.calls[1][1].body)).toEqual(p);
  });

  it('resposta com a forma errada vira texto vazio e nenhuma ação', async () => {
    const buscar = vi.fn().mockResolvedValueOnce(json({ ativo: true })).mockResolvedValueOnce(json({ texto: 5, acoes: 'x' }));
    expect(await perguntarNoServidor(p, buscar)).toEqual({ texto: '', acoes: [] });
  });

  it.each([['limite', 429], ['chave-recusada', 502], ['indisponivel', 502]] as const)('erro "%s" do servidor vira ErroDoAssistente', async (motivo, status) => {
    const buscar = vi.fn().mockResolvedValueOnce(json({ ativo: true })).mockResolvedValueOnce(json({ motivo }, status));
    await expect(perguntarNoServidor(p, buscar)).rejects.toMatchObject({ name: 'ErroDoAssistente', motivo });
  });

  it('rede fora do ar e resposta que não é JSON viram "indisponivel"; chave retirada no meio vira null', async () => {
    await expect(perguntarNoServidor(p, vi.fn().mockRejectedValue(new TypeError('fetch failed')))).rejects.toBeInstanceOf(ErroDoAssistente);
    const html = vi.fn().mockResolvedValueOnce(json({ ativo: true })).mockResolvedValueOnce(new Response('<html>', { status: 200 }));
    await expect(perguntarNoServidor(p, html)).rejects.toMatchObject({ motivo: 'indisponivel' });
    const semChave = vi.fn().mockResolvedValueOnce(json({ ativo: true })).mockResolvedValueOnce(json({ motivo: 'sem-chave' }, 503));
    expect(await perguntarNoServidor(p, semChave)).toBeNull();
  });
});
