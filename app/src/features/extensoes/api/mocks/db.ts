import { formatarHora, nomeCanal } from '../../domain/formatacao';
import { contarDias, minutosPorDia, totalMinutos } from '../../domain/horas';
import { deslocarDatas, diasEntre, hoje, isoDia } from '../../../../mock/datas';
import { grupoCompletoDaPessoa } from '../../../../mock/grupos';
import { definirFalhaDeRede } from '../../../../mock/rede';
import { JUSTIFICATIVA_OUTRA } from '../../domain/types';
import type {
  Canal, Decisao, Evento, Justificativa, NovoPedido, Pedido, Permissoes, Pessoa, ResultadoLote, ResumoBeneficiario, Totais,
} from '../../domain/types';

export const PESSOAS = {
  carlos: { id: 'u-carlos', nome: 'Carlos Mendes' },
  ana: { id: 'u-ana', nome: 'Ana Souza' },
  joao: { id: 'u-joao', nome: 'João Lima' },
  bia: { id: 'u-bia', nome: 'Bia Rocha' },
  rui: { id: 'u-rui', nome: 'Rui Alves' },
  xavier: { id: 'u-xavier', nome: 'Xavier Pinto' },
  olga: { id: 'u-olga', nome: 'Olga Prado' },
  renata: { id: 'u-renata', nome: 'Renata Dias' },
} satisfies Record<string, Pessoa>;
export type ChavePessoa = keyof typeof PESSOAS;

const { carlos, ana, joao, bia, rui, xavier, olga, renata } = PESSOAS;

const GESTOR: Record<string, Pessoa | null> = {
  [ana.id]: carlos, [joao.id]: carlos, [bia.id]: carlos, [rui.id]: carlos, [xavier.id]: olga,
};
// O grupo e o limite mensal de cada pessoa vêm do cadastro de Grupos (mock/grupos).
const nomeDoGrupo = (pessoaId: string): string | null => grupoCompletoDaPessoa(pessoaId)?.nome ?? null;
const COLABORADOR = { podePedir: true, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false, podeVerRelatorios: false, podeGerirPessoas: false, podeAdministrar: false };
const GESTOR_PERFIL = { ...COLABORADOR, podePedirParaOutros: true, podeAprovar: true, podeVerRelatorios: true };
const PERFIL: Record<string, Omit<Permissoes, 'usuario'>> = {
  // Carlos é o usuário padrão da demonstração: gestor que também administra o sistema (vê o menu inteiro).
  [carlos.id]: { ...GESTOR_PERFIL, podeGerirPessoas: true, podeAdministrar: true },
  [olga.id]: GESTOR_PERFIL,
  [renata.id]: { ...COLABORADOR, podePedir: false, podeVerTodos: true, podeVerRelatorios: true, podeGerirPessoas: true },
};

export const JUSTIFICATIVAS: Justificativa[] = [
  { codigo: '2', descricao: 'Atendimento a incidente crítico' },
  { codigo: '5', descricao: 'Curso' },
  { codigo: '4', descricao: 'Demanda de projeto' },
  { codigo: '1', descricao: 'Fechamento mensal' },
  { codigo: '3', descricao: 'Janela de deploy' },
];
const J = (codigo: string) => JUSTIFICATIVAS.find((j) => j.codigo === codigo)!;

type Semente = Partial<Pedido> & Pick<Pedido, 'id' | 'beneficiario' | 'dataInicial' | 'horario' | 'justificativa' | 'criadoEm'>;

function pedido(d: Semente): Pedido {
  return {
    solicitante: d.beneficiario,
    gestor: GESTOR[d.beneficiario.id] ?? null,
    grupo: nomeDoGrupo(d.beneficiario.id),
    dataFinal: d.dataInicial,
    detalhes: '',
    status: 'pendente',
    decisao: null,
    historico: [{ tipo: 'criado', por: d.solicitante ?? d.beneficiario, canal: 'painel', em: d.criadoEm }],
    ...d,
  };
}

/** Os pedidos de exemplo foram escritos para 12/10/2026; aqui eles acompanham a data de hoje. */
const DIA_DE_REFERENCIA = '2026-10-12';

function estadoInicial() {
  return deslocarDatas({
    usuarioId: carlos.id,
    falhar: false,
    seq: 9,
    pedidos: [
      pedido({
        id: 'p-1', beneficiario: ana, dataInicial: '2026-10-13', dataFinal: '2026-10-15', horario: { inicio: '18:00', fim: '20:00' },
        justificativa: J('3'), detalhes: 'Atualização do ERP', criadoEm: '2026-10-12T08:30:00',
        historico: [
          { tipo: 'criado', por: ana, canal: 'painel', em: '2026-10-12T08:30:00' },
          { tipo: 'avisado', por: carlos, canal: 'whatsapp', em: '2026-10-12T08:31:00' },
        ],
      }),
      pedido({ id: 'p-2', beneficiario: joao, dataInicial: '2026-10-13', dataFinal: '2026-10-14', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('1'), criadoEm: '2026-10-11T17:00:00' }),
      pedido({ id: 'p-3', beneficiario: bia, dataInicial: '2026-10-16', horario: { inicio: '18:00', fim: '21:00' }, justificativa: J('2'), criadoEm: '2026-10-12T09:00:00' }),
      pedido({ id: 'p-4', beneficiario: rui, dataInicial: '2026-10-17', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('5'), criadoEm: '2026-10-12T09:30:00' }),
      pedido({
        id: 'p-5', beneficiario: ana, dataInicial: '2026-10-06', dataFinal: '2026-10-08', horario: { inicio: '18:00', fim: '20:00' },
        justificativa: J('3'), criadoEm: '2026-10-05T15:00:00', status: 'aprovado',
        decisao: { status: 'aprovado', por: carlos, canal: 'painel', em: '2026-10-05T19:00:00' },
      }),
      pedido({
        id: 'p-6', beneficiario: joao, dataInicial: '2026-10-01', horario: { inicio: '18:00', fim: '20:00' }, justificativa: J('4'),
        criadoEm: '2026-09-30T16:00:00', status: 'reprovado',
        decisao: { status: 'reprovado', por: carlos, canal: 'painel', em: '2026-09-30T19:05:00', motivo: 'outro_horario', mensagem: 'Pode ser na quinta? Segunda tem reunião cedo.' },
        historico: [
          { tipo: 'criado', por: joao, canal: 'painel', em: '2026-09-30T16:00:00' },
          { tipo: 'avisado', por: carlos, canal: 'whatsapp', em: '2026-09-30T16:01:00' },
          { tipo: 'reprovado', por: carlos, canal: 'painel', em: '2026-09-30T19:05:00' },
        ],
      }),
      pedido({ id: 'p-7', beneficiario: ana, dataInicial: '2026-10-20', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('5'), criadoEm: '2026-10-09T10:00:00', status: 'cancelado' }),
      pedido({ id: 'p-8', beneficiario: bia, dataInicial: '2026-09-29', horario: { inicio: '18:00', fim: '20:00' }, justificativa: J('3'), criadoEm: '2026-09-28T11:00:00' }),
      pedido({ id: 'p-9', beneficiario: xavier, dataInicial: '2026-10-14', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('5'), criadoEm: '2026-10-10T10:00:00' }),
    ],
  }, diasEntre(DIA_DE_REFERENCIA, hoje()));
}

let estado = estadoInicial();

export function resetarDb(): void { estado = estadoInicial(); definirFalhaDeRede(false); }
export function entrarComo(chave: ChavePessoa): void { estado.usuarioId = PESSOAS[chave].id; }
export function simularFalha(ligado: boolean): void { estado.falhar = ligado; definirFalhaDeRede(ligado); }
export function estaFalhando(): boolean { return estado.falhar; }
export function todosOsPedidos(): Pedido[] { return estado.pedidos; }

function pessoaPorId(id: string): Pessoa | undefined {
  return Object.values(PESSOAS).find((p) => p.id === id);
}
export function usuarioAtual(): Pessoa { return pessoaPorId(estado.usuarioId)!; }
export function permissoesAtuais(): Permissoes {
  return { usuario: usuarioAtual(), ...(PERFIL[estado.usuarioId] ?? COLABORADOR) };
}

/** Agora, no horário local e sem fuso ("2026-10-12T22:30:00"), igual às datas dos dados de exemplo. */
const agoraIso = () => {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${isoDia(d)}T${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
};
const acharPedido = (id: string) => estado.pedidos.find((p) => p.id === id);
function semHistorico(p: Pedido): Pedido {
  const { historico, ...resto } = p;
  void historico;
  return resto;
}

const STATUS_VALIDOS = ['pendente', 'aprovado', 'reprovado', 'cancelado'];

function filtrar(params: URLSearchParams): Pedido[] | 'proibido' {
  const perm = permissoesAtuais();
  const u = estado.usuarioId;
  const aba = params.get('aba') ?? 'meus';
  if ((aba === 'todos' && !perm.podeVerTodos) || (aba === 'aprovar' && !perm.podeAprovar)) return 'proibido';
  const de = params.get('de') ?? '';
  const ate = params.get('ate') ?? '';
  const status = params.get('status') ?? '';
  const pessoa = (params.get('pessoa') ?? '').toLowerCase();
  const gestor = (params.get('gestor') ?? '').toLowerCase();
  const grupo = (params.get('grupo') ?? '').toLowerCase();
  const lista = estado.pedidos.filter((p) => {
    if (aba === 'aprovar' && !(p.status === 'pendente' && p.gestor?.id === u)) return false;
    if (aba === 'meus' && p.beneficiario.id !== u && p.solicitante.id !== u) return false;
    if (de && p.dataFinal < de) return false;
    if (ate && p.dataInicial > ate) return false;
    if (STATUS_VALIDOS.includes(status) && p.status !== status) return false;
    if (pessoa && !`${p.beneficiario.nome} ${p.solicitante.nome}`.toLowerCase().includes(pessoa)) return false;
    if (gestor && !(p.gestor?.nome ?? '').toLowerCase().includes(gestor)) return false;
    if (grupo && !(p.grupo ?? '').toLowerCase().includes(grupo)) return false;
    return true;
  });
  const sentido = aba === 'aprovar' ? 1 : -1; // fila: mais antigo primeiro; resto: mais recente primeiro
  return lista.sort((a, b) => sentido * (new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()));
}

export function listarDb(params: URLSearchParams): { itens: Pedido[]; total: number } | 'proibido' {
  const r = filtrar(params);
  if (r === 'proibido') return r;
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const tamanho = Math.max(1, Number(params.get('tamanho')) || 25);
  return { itens: r.slice((pagina - 1) * tamanho, pagina * tamanho).map(semHistorico), total: r.length };
}

export function totaisDb(params: URLSearchParams): Totais | 'proibido' {
  const r = filtrar(params);
  if (r === 'proibido') return r;
  return {
    pendentes: r.filter((p) => p.status === 'pendente').length,
    minutosAprovados: r.filter((p) => p.status === 'aprovado').reduce((s, p) => s + totalMinutos(p.dataInicial, p.dataFinal, p.horario), 0),
    reprovados: r.filter((p) => p.status === 'reprovado').length,
  };
}

export function exportarCsvDb(params: URLSearchParams): string | 'proibido' {
  const r = filtrar(params);
  if (r === 'proibido') return r;
  const linhas = r.map((p) => [p.beneficiario.nome, p.solicitante.nome, p.dataInicial, p.dataFinal, p.horario.inicio, p.horario.fim, p.justificativa.descricao, p.status].join(';'));
  return ['beneficiario;solicitante;data_inicial;data_final;inicio;fim;justificativa;status', ...linhas].join('\n');
}

export function obterDb(id: string): Pedido | 'nao-encontrado' | 'proibido' {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  const u = estado.usuarioId;
  const visivel = p.beneficiario.id === u || p.solicitante.id === u || p.gestor?.id === u || permissoesAtuais().podeVerTodos;
  return visivel ? p : 'proibido';
}

function justificativaDe(codigo: string): Justificativa | undefined {
  return codigo === JUSTIFICATIVA_OUTRA ? { codigo: JUSTIFICATIVA_OUTRA, descricao: 'Outra' } : JUSTIFICATIVAS.find((j) => j.codigo === codigo);
}
function dadosValidos(d: NovoPedido): boolean {
  return contarDias(d.dataInicial, d.dataFinal) > 0 && minutosPorDia(d.horario) > 0 && !!justificativaDe(d.justificativaCodigo) && !!pessoaPorId(d.beneficiarioId);
}
function temConflito(beneficiarioId: string, inicio: string, fim: string, ignorarId?: string): boolean {
  return estado.pedidos.some((p) => p.id !== ignorarId && p.status === 'pendente' && p.beneficiario.id === beneficiarioId && p.dataInicial <= fim && inicio <= p.dataFinal);
}

export function criarPedidoDb(d: NovoPedido): Pedido | 'conflito' | 'invalido' {
  if (!dadosValidos(d)) return 'invalido';
  if (temConflito(d.beneficiarioId, d.dataInicial, d.dataFinal)) return 'conflito';
  const beneficiario = pessoaPorId(d.beneficiarioId)!;
  const u = usuarioAtual();
  const em = agoraIso();
  const gestor = GESTOR[beneficiario.id] ?? null;
  const historico: Evento[] = [{ tipo: 'criado', por: u, canal: 'painel', em }];
  if (gestor) historico.push({ tipo: 'avisado', por: gestor, canal: 'whatsapp', em });
  const novo: Pedido = {
    id: `p-${++estado.seq}`, beneficiario, solicitante: u, gestor, grupo: nomeDoGrupo(beneficiario.id),
    dataInicial: d.dataInicial, dataFinal: d.dataFinal, horario: d.horario, justificativa: justificativaDe(d.justificativaCodigo)!,
    detalhes: d.detalhes, status: 'pendente', criadoEm: em, decisao: null, historico,
  };
  estado.pedidos.push(novo);
  return novo;
}

const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
function descreverMudancas(a: Pedido, d: NovoPedido): string {
  const m: string[] = [];
  if (a.dataInicial !== d.dataInicial || a.dataFinal !== d.dataFinal) m.push(`dias ${ddmm(a.dataInicial)}–${ddmm(a.dataFinal)} → ${ddmm(d.dataInicial)}–${ddmm(d.dataFinal)}`);
  if (a.horario.inicio !== d.horario.inicio || a.horario.fim !== d.horario.fim) m.push(`horário ${a.horario.inicio}–${a.horario.fim} → ${d.horario.inicio}–${d.horario.fim}`);
  if (a.justificativa.codigo !== d.justificativaCodigo) m.push(`motivo ${a.justificativa.descricao} → ${justificativaDe(d.justificativaCodigo)?.descricao}`);
  if (a.detalhes !== d.detalhes) m.push('detalhes alterados');
  return m.join('; ') || 'sem mudanças';
}

export function editarPedidoDb(id: string, d: NovoPedido): Pedido | 'nao-encontrado' | 'nao-editavel' | 'conflito' | 'invalido' {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  if (p.status !== 'pendente' || p.solicitante.id !== estado.usuarioId) return 'nao-editavel';
  if (!dadosValidos(d)) return 'invalido';
  if (temConflito(d.beneficiarioId, d.dataInicial, d.dataFinal, id)) return 'conflito';
  const detalhe = descreverMudancas(p, d);
  const beneficiario = pessoaPorId(d.beneficiarioId)!;
  Object.assign(p, {
    beneficiario, gestor: GESTOR[beneficiario.id] ?? null, grupo: nomeDoGrupo(beneficiario.id),
    dataInicial: d.dataInicial, dataFinal: d.dataFinal, horario: d.horario, justificativa: justificativaDe(d.justificativaCodigo)!, detalhes: d.detalhes,
  });
  p.historico = [...(p.historico ?? []), { tipo: 'editado', por: usuarioAtual(), canal: 'painel', em: agoraIso(), detalhe }];
  return p;
}

export function cancelarDb(id: string): Pedido | 'nao-encontrado' | 'nao-cancelavel' {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  const u = estado.usuarioId;
  if (p.status !== 'pendente' || (p.solicitante.id !== u && p.beneficiario.id !== u)) return 'nao-cancelavel';
  p.status = 'cancelado';
  p.historico = [...(p.historico ?? []), { tipo: 'cancelado', por: usuarioAtual(), canal: 'painel', em: agoraIso() }];
  return p;
}

export type ResultadoDecisao = Pedido | 'nao-encontrado' | 'proibido' | 'invalido' | { conflito: 'JA_DECIDIDO' | 'NAO_PENDENTE'; pedido: Pedido };

export function decidirDb(id: string, decisao: Decisao, canal: Canal = 'painel', por: Pessoa = usuarioAtual()): ResultadoDecisao {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  if (p.gestor?.id !== por.id) return 'proibido';
  if (decisao.acao === 'reprovar' && !decisao.motivo) return 'invalido';
  if (p.status === 'cancelado') return { conflito: 'NAO_PENDENTE', pedido: p };
  if (p.status !== 'pendente') return { conflito: 'JA_DECIDIDO', pedido: p };
  const em = agoraIso();
  const status = decisao.acao === 'aprovar' ? 'aprovado' : 'reprovado';
  p.status = status;
  p.decisao = decisao.acao === 'aprovar'
    ? { status, por, canal, em, comentario: decisao.comentario }
    : { status, por, canal, em, motivo: decisao.motivo, mensagem: decisao.mensagem };
  p.historico = [...(p.historico ?? []), { tipo: status, por, canal, em }];
  return p;
}

/** Simula a decisão tomada fora do painel (Teams/WhatsApp) pelo gestor do pedido. */
export function decidirExterno(id: string, status: 'aprovado' | 'reprovado', canal: Canal = 'whatsapp'): void {
  const p = acharPedido(id);
  if (!p?.gestor) return;
  decidirDb(id, status === 'aprovado' ? { acao: 'aprovar' } : { acao: 'reprovar', motivo: 'outro_horario' }, canal, p.gestor);
}

export function decidirEmLoteDb(ids: string[], decisao: Decisao): ResultadoLote {
  const r: ResultadoLote = { sucesso: [], falhas: [] };
  for (const id of ids) {
    const res = decidirDb(id, decisao);
    const nome = acharPedido(id)?.beneficiario.nome ?? id;
    if (typeof res === 'string') {
      const motivo = res === 'proibido' ? 'você não pode decidir este pedido' : res === 'nao-encontrado' ? 'o pedido não existe mais' : 'dados inválidos';
      r.falhas.push({ id, nome, motivo });
    } else if ('conflito' in res) {
      const d = res.pedido.decisao;
      const motivo = res.conflito === 'NAO_PENDENTE' || !d
        ? 'o pedido foi cancelado'
        : `já tinha sido ${d.status} por ${d.por.nome} via ${nomeCanal(d.canal)} às ${formatarHora(d.em)}`;
      r.falhas.push({ id, nome, motivo });
    } else {
      r.sucesso.push(id);
    }
  }
  return r;
}

export function colaboradoresDb(): Pessoa[] {
  return Object.values(PESSOAS).filter((p) => GESTOR[p.id]?.id === estado.usuarioId);
}

export function resumoDb(beneficiarioId: string, mes: string): ResumoBeneficiario | null {
  // Sem grupo, não há dado de limite: a tela esconde a parte de limite (spec, seção 6).
  const grupo = grupoCompletoDaPessoa(beneficiarioId);
  if (!grupo) return null;
  const minutos = estado.pedidos
    .filter((p) => p.beneficiario.id === beneficiarioId && p.status === 'aprovado' && p.dataInicial.startsWith(mes))
    .reduce((s, p) => s + totalMinutos(p.dataInicial, p.dataFinal, p.horario), 0);
  const limiteMensalMin = grupo.limiteHoras === '' ? null : grupo.limiteHoras * 60;
  return { minutosAprovadosNoMes: minutos, limiteMensalMin, aprovador: GESTOR[beneficiarioId] ?? null };
}
