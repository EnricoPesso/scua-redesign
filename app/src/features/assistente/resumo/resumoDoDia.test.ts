import { describe, expect, it } from 'vitest';
import type { DiaDeJornada } from '../../../mock/jornadaReal';
import type { EstacaoDiretorio } from '../../../mock/diretorio';
import type { Pedido, Permissoes, ResumoBeneficiario } from '../../extensoes/domain/types';
import {
  chaveDoResumo, classificarPedidos, equipeVisivel, fraseDeAbertura, montarResumo, textoDoContador,
  type EntradaDoResumo, type PedidoParaDecidir,
} from './resumoDoDia';

const HOJE = '2026-10-12';
const nomes: Record<string, string> = { 'u-ana': 'Ana Souza', 'u-joao': 'João Lima', 'u-bia': 'Bia Rocha', 'u-xavier': 'Xavier Pinto' };
const nomeDe = (id: string) => nomes[id] ?? id;

const COLABORADOR: Permissoes = { usuario: { id: 'u-ana', nome: 'Ana Souza' }, podePedir: true, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false, podeVerRelatorios: false, podeGerirPessoas: false, podeAdministrar: false };
const GESTOR: Permissoes = { ...COLABORADOR, usuario: { id: 'u-carlos', nome: 'Carlos Mendes' }, podePedirParaOutros: true, podeAprovar: true, podeVerRelatorios: true };
const ADMIN: Permissoes = { ...GESTOR, podeGerirPessoas: true, podeAdministrar: true };

const pessoas = [
  { id: 'u-carlos', gestorId: null }, { id: 'u-ana', gestorId: 'u-carlos' }, { id: 'u-joao', gestorId: 'u-carlos' },
  { id: 'u-bia', gestorId: 'u-ana' }, { id: 'u-xavier', gestorId: 'u-olga' }, { id: 'u-olga', gestorId: null },
];

/** Um dia de trabalho com a hora além da jornada dada. */
function dia(pessoaId: string, data: string, extra: { aprovada?: number; semAprovacao?: number } = {}): DiaDeJornada {
  return {
    pessoaId, dia: data, diaDaSemana: 2, previstoInicio: '08:00', previstoFim: '17:00', intervaloPrevistoMin: 60,
    primeiroLogon: '08:00', ultimoLogoff: '17:00', intervaloRealMin: 60,
    extraAprovadaMin: extra.aprovada ?? 0, extraSemAprovacaoMin: extra.semAprovacao ?? 0,
    tentativasBloqueadas: 0, minutosEvitados: 0, pausasPrevistas: 2, pausasFeitas: 2,
  };
}

const pedidoParaDecidir = (id: string, dentro: boolean, extra: Partial<PedidoParaDecidir> = {}): PedidoParaDecidir => ({
  id, nome: nomeDe('u-ana'), minutos: 120, periodo: '13/10 · 18:00–20:00', dentroDoLimite: dentro, diasEsperando: 0,
  ...(dentro ? {} : { motivoFora: 'passaria do limite mensal do grupo Comercial (12h de 10h)' }), ...extra,
});

const entrada = (parcial: Partial<EntradaDoResumo>): EntradaDoResumo => ({
  permissoes: GESTOR, hoje: HOJE, pedidos: [], meusPendentes: 0, equipe: new Set(), dias: [], estacoes: [], ...parcial,
});

describe('classificarPedidos: limite mensal do grupo', () => {
  const pedido = (id: string, beneficiarioId: string, criadoEm: string, fim = '20:00'): Pedido => ({
    id, beneficiario: { id: beneficiarioId, nome: nomeDe(beneficiarioId) }, solicitante: { id: beneficiarioId, nome: nomeDe(beneficiarioId) },
    gestor: { id: 'u-carlos', nome: 'Carlos Mendes' }, grupo: 'Comercial', dataInicial: '2026-10-13', dataFinal: '2026-10-13',
    horario: { inicio: '18:00', fim }, justificativa: { codigo: '1', descricao: 'Fechamento mensal' }, detalhes: '', status: 'pendente', criadoEm, decisao: null,
  });
  const resumo = (usadoMin: number, limiteMensalMin: number | null): ResumoBeneficiario => ({ minutosAprovadosNoMes: usadoMin, limiteMensalMin, aprovador: null });
  const chave = (id: string) => chaveDoResumo(id, '2026-10');

  it('cabe no limite: entra; passa do limite: fica de fora, com o motivo', () => {
    const r = classificarPedidos(
      [pedido('p1', 'u-ana', '2026-10-10T09:00:00'), pedido('p2', 'u-joao', '2026-10-10T09:00:00')],
      new Map([[chave('u-ana'), resumo(0, 600)], [chave('u-joao'), resumo(540, 600)]]), HOJE,
    );
    expect(r[0]).toMatchObject({ id: 'p1', dentroDoLimite: true });
    expect(r[1]).toMatchObject({ id: 'p2', dentroDoLimite: false });
    expect(r[1].motivoFora).toContain('limite mensal do grupo Comercial');
    expect(r[1].motivoFora).toContain('11h de 10h');
  });

  it('pedidos da mesma pessoa no mês se somam, do mais antigo ao mais novo', () => {
    const r = classificarPedidos(
      [pedido('novo', 'u-ana', '2026-10-11T09:00:00'), pedido('antigo', 'u-ana', '2026-10-09T09:00:00')],
      new Map([[chave('u-ana'), resumo(0, 200)]]), HOJE,
    );
    // Cada pedido tem 2h (120 min): o antigo cabe, o novo estouraria as 3h20.
    expect(r.find((x) => x.id === 'antigo')?.dentroDoLimite).toBe(true);
    expect(r.find((x) => x.id === 'novo')?.dentroDoLimite).toBe(false);
  });

  it('grupo sem limite sempre cabe; limite zero nunca cabe', () => {
    const r = classificarPedidos(
      [pedido('p1', 'u-ana', '2026-10-10T09:00:00'), pedido('p2', 'u-joao', '2026-10-10T09:00:00')],
      new Map([[chave('u-ana'), resumo(9999, null)], [chave('u-joao'), resumo(0, 0)]]), HOJE,
    );
    expect(r.map((x) => x.dentroDoLimite)).toEqual([true, false]);
  });

  it('sem o dado do limite não dá para garantir: fica de fora', () => {
    const [x] = classificarPedidos([pedido('p1', 'u-ana', '2026-10-10T09:00:00')], new Map(), HOJE);
    expect(x.dentroDoLimite).toBe(false);
    expect(x.motivoFora).toMatch(/não consegui conferir/);
  });

  it('conta os dias de espera e as horas do pedido', () => {
    const [x] = classificarPedidos([pedido('p1', 'u-ana', '2026-10-09T09:00:00', '19:30')], new Map([[chave('u-ana'), resumo(0, null)]]), HOJE);
    expect(x).toMatchObject({ minutos: 90, diasEsperando: 3, periodo: '13/10 · 18:00–19:30' });
  });
});

describe('equipeVisivel', () => {
  it('gestão vê a equipe direta e a indireta, sem ela mesma e sem gente de outra equipe', () => {
    expect([...equipeVisivel(GESTOR, pessoas)].sort()).toEqual(['u-ana', 'u-bia', 'u-joao']);
  });
  it('colaborador não vê ninguém', () => {
    expect(equipeVisivel(COLABORADOR, pessoas).size).toBe(0);
  });
  it('RH e administração veem todos, menos a si mesmos', () => {
    expect(equipeVisivel(ADMIN, pessoas).size).toBe(pessoas.length - 1);
    expect(equipeVisivel({ ...COLABORADOR, podeVerTodos: true }, pessoas).has('u-ana')).toBe(false);
  });
});

describe('montarResumo', () => {
  it('sem nada para fazer: tudo em ordem', () => {
    const r = montarResumo(entrada({}), nomeDe);
    expect(r).toEqual({ itens: [], tudoEmOrdem: true });
  });

  it('pedidos esperando: quantos, quantos cabem no limite, e o aprovar em lote só quando há o que aprovar', () => {
    const r = montarResumo(entrada({ pedidos: [pedidoParaDecidir('a', true), pedidoParaDecidir('b', true), pedidoParaDecidir('c', false)] }), nomeDe);
    const item = r.itens[0];
    expect(item).toMatchObject({ id: 'pedidos', rota: '/extensoes/aprovar', gravidade: 'media', aprovarEmLote: true });
    expect(item.titulo).toBe('3 pedidos de extensão esperam a sua decisão');
    expect(item.detalhe).toBe('2 dentro do limite do grupo, 1 passa do limite.');
    const so = montarResumo(entrada({ pedidos: [pedidoParaDecidir('c', false)] }), nomeDe).itens[0];
    expect(so.titulo).toBe('1 pedido de extensão espera a sua decisão');
    expect(so.aprovarEmLote).toBe(false);
  });

  it('pedido esperando há 2 dias ou mais sobe para prioridade alta', () => {
    const item = montarResumo(entrada({ pedidos: [pedidoParaDecidir('a', true, { diasEsperando: 3 })] }), nomeDe).itens[0];
    expect(item.gravidade).toBe('alta');
    expect(item.detalhe).toContain('o mais antigo espera há 3 dias');
  });

  it('quem não aprova não recebe o item dos pedidos', () => {
    const r = montarResumo(entrada({ permissoes: COLABORADOR, pedidos: [pedidoParaDecidir('a', true)] }), nomeDe);
    expect(r.itens.find((i) => i.id === 'pedidos')).toBeUndefined();
  });

  it('hora além da jornada sem aprovação nos últimos 7 dias: quem, quanto e o valor em R$; dias mais antigos não contam', () => {
    const r = montarResumo(entrada({
      equipe: new Set(['u-ana', 'u-joao']),
      dias: [
        dia('u-ana', '2026-10-09', { semAprovacao: 90 }), dia('u-ana', '2026-10-10', { semAprovacao: 30 }),
        dia('u-joao', '2026-10-08', { semAprovacao: 60 }),
        dia('u-joao', '2026-10-01', { semAprovacao: 600 }), // fora dos 7 dias
      ],
    }), nomeDe);
    const item = r.itens.find((i) => i.id === 'passivo')!;
    expect(item.rota).toBe('/radar-de-passivo');
    expect(item.titulo).toBe('3h além da jornada sem aprovação nos últimos 7 dias');
    expect(item.detalhe).toMatch(/^Ana Souza \(2h\) e João Lima \(1h\)\. Valor estimado: R\$\s?[\d.]+\.$/);
  });

  it('não mostra nem soma gente fora da equipe', () => {
    const r = montarResumo(entrada({
      equipe: new Set(['u-ana']),
      dias: [dia('u-ana', '2026-10-09', { semAprovacao: 60 }), dia('u-xavier', '2026-10-09', { semAprovacao: 240 })],
    }), nomeDe);
    const item = r.itens.find((i) => i.id === 'passivo')!;
    expect(item.detalhe).not.toContain('Xavier');
    expect(item.titulo).toContain('1h além');
  });

  it('colaborador só vê o que é dele, mesmo que receba dados de outras pessoas', () => {
    const r = montarResumo(entrada({
      permissoes: COLABORADOR, meusPendentes: 2, equipe: new Set(),
      dias: [dia('u-joao', '2026-10-09', { semAprovacao: 240 })],
      estacoes: [{ nome: 'SCUA-X', dominio: 'scua.local', versaoAgente: '2.0.10', ativa: true, diasSemRegistro: 9, liberada: false }],
    }), nomeDe);
    expect(r.itens.map((i) => i.id)).toEqual(['meu-pedido']);
    expect(r.itens[0]).toMatchObject({ titulo: '2 pedidos seus aguardam resposta', gravidade: 'baixa', rota: '/extensoes/meus' });
  });

  it('hora extra subindo: a última semana contra a anterior', () => {
    const dias = [
      // Ana: 1h antes, 4h agora (subindo). João: igual nas duas semanas. Bia: pouca coisa.
      dia('u-ana', '2026-10-02', { aprovada: 60 }), dia('u-ana', '2026-10-08', { aprovada: 120 }), dia('u-ana', '2026-10-09', { aprovada: 120 }),
      dia('u-joao', '2026-10-02', { aprovada: 180 }), dia('u-joao', '2026-10-09', { aprovada: 180 }),
      dia('u-bia', '2026-10-02', { aprovada: 0 }), dia('u-bia', '2026-10-09', { aprovada: 30 }),
    ];
    const item = montarResumo(entrada({ equipe: new Set(['u-ana', 'u-joao', 'u-bia']), dias }), nomeDe).itens.find((i) => i.id === 'previsao')!;
    expect(item.rota).toBe('/previsao');
    expect(item.titulo).toBe('1 pessoa com hora extra subindo');
    expect(item.detalhe).toBe('Ana Souza (4h na semana, antes 1h).');
  });

  it('estações paradas há mais de 3 dias: só para quem administra, e só as ativas', () => {
    const estacao = (nome: string, diasSemRegistro: number, ativa = true): EstacaoDiretorio => ({ nome, dominio: 'scua.local', versaoAgente: '2.0.10', ativa, diasSemRegistro, liberada: false });
    const estacoes = [estacao('A-1', 4), estacao('A-2', 3), estacao('A-3', 10), estacao('A-4', 90, false)];
    const admin = montarResumo(entrada({ permissoes: ADMIN, estacoes }), nomeDe).itens.find((i) => i.id === 'estacoes')!;
    expect(admin).toMatchObject({ titulo: '2 estações pararam de reportar há mais de 3 dias', detalhe: 'A-1 e A-3.', gravidade: 'alta' });
    expect(montarResumo(entrada({ permissoes: GESTOR, estacoes }), nomeDe).itens.find((i) => i.id === 'estacoes')).toBeUndefined();
  });

  it('ordena do mais grave para o menos grave', () => {
    const r = montarResumo(entrada({
      permissoes: ADMIN, meusPendentes: 1,
      pedidos: [pedidoParaDecidir('a', true)],
      estacoes: [{ nome: 'A-1', dominio: 'scua.local', versaoAgente: '2.0.10', ativa: true, diasSemRegistro: 8, liberada: false }],
    }), nomeDe);
    expect(r.itens.map((i) => i.id)).toEqual(['estacoes', 'pedidos', 'meu-pedido']);
    expect(r.itens.map((i) => i.gravidade)).toEqual(['alta', 'media', 'baixa']);
  });
});

describe('textos', () => {
  it('abertura do dia: saudação pela hora e o número de itens', () => {
    expect(fraseDeAbertura('Carlos', 3, 9)).toBe('Bom dia, Carlos. 3 coisas precisam de você hoje:');
    expect(fraseDeAbertura('Carlos', 1, 14)).toBe('Boa tarde, Carlos. 1 coisa precisa de você hoje:');
    expect(fraseDeAbertura('Carlos', 0, 20)).toBe('Boa noite, Carlos. Tudo em ordem por aqui.');
  });
  it('contador da bolha para o leitor de tela', () => {
    expect(textoDoContador(3)).toBe('3 itens precisam de você');
    expect(textoDoContador(1)).toBe('1 item precisa de você');
  });
});
