export type Status = 'pendente' | 'aprovado' | 'reprovado' | 'cancelado';
export type Canal = 'painel' | 'teams' | 'whatsapp';
export type Aba = 'aprovar' | 'meus' | 'todos';
export type MotivoReprovacao = 'nao_necessario' | 'outro_horario' | 'periodo_errado' | 'outro';
export type TipoEvento = 'criado' | 'editado' | 'avisado' | 'aprovado' | 'reprovado' | 'cancelado';

/** Código da opção "Outra" no campo Motivo (não vem da API; a tela acrescenta). */
export const JUSTIFICATIVA_OUTRA = 'OUTRA';

export interface Pessoa { id: string; nome: string }
/** Horas no formato HH:MM. Vale para cada dia do intervalo. */
export interface Horario { inicio: string; fim: string }
export interface Justificativa { codigo: string; descricao: string }

export interface Evento {
  tipo: TipoEvento;
  por: Pessoa | null;
  canal: Canal;
  /** Data/hora ISO. */
  em: string;
  /** Em "editado": o que mudou, ex.: "horário 18:00–21:00 → 18:00–20:00". */
  detalhe?: string;
}

export interface DecisaoRegistrada {
  status: 'aprovado' | 'reprovado';
  por: Pessoa;
  canal: Canal;
  em: string;
  comentario?: string;
  motivo?: MotivoReprovacao;
  mensagem?: string;
}

export interface Pedido {
  id: string;
  beneficiario: Pessoa;
  solicitante: Pessoa;
  gestor: Pessoa | null;
  grupo: string | null;
  /** YYYY-MM-DD. dataFinal é igual a dataInicial quando é um dia só. */
  dataInicial: string;
  dataFinal: string;
  horario: Horario;
  justificativa: Justificativa;
  detalhes: string;
  status: Status;
  criadoEm: string;
  decisao: DecisaoRegistrada | null;
  /** Só vem no GET de um pedido; ausente se a API não registrar. */
  historico?: Evento[];
}

export interface Permissoes {
  usuario: Pessoa;
  podePedir: boolean;
  podePedirParaOutros: boolean;
  podeAprovar: boolean;
  podeVerTodos: boolean;
}

export interface Filtros {
  aba: Aba;
  /** '' = sem limite. */
  de: string;
  ate: string;
  status?: Status;
  pessoa?: string;
  gestor?: string;
  grupo?: string;
  pagina: number;
  tamanho: number;
}
export type FiltrosSemPagina = Omit<Filtros, 'pagina' | 'tamanho'>;

export interface Pagina<T> { itens: T[]; total: number }
export interface Totais { pendentes: number; minutosAprovados: number; reprovados: number }

export interface ResumoBeneficiario {
  minutosAprovadosNoMes: number;
  /** null = grupo sem limite. */
  limiteMensalMin: number | null;
  aprovador: Pessoa | null;
}

export interface NovoPedido {
  beneficiarioId: string;
  dataInicial: string;
  dataFinal: string;
  horario: Horario;
  justificativaCodigo: string;
  detalhes: string;
}

export type Decisao =
  | { acao: 'aprovar'; comentario?: string }
  | { acao: 'reprovar'; motivo: MotivoReprovacao; mensagem?: string };

export interface ResultadoLote {
  sucesso: string[];
  falhas: { id: string; nome: string; motivo: string }[];
}
