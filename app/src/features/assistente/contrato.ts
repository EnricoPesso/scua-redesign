/**
 * Contrato do assistente de IA: o que o navegador manda para `/api/assistente` e o que recebe de volta.
 * É o mesmo contrato para o intermediário de desenvolvimento, para o modo simulado e para o servidor real da Scua
 * (ver docs/contrato-assistente.md). Este arquivo não pode importar nada do navegador nem do Node.
 */

export type Papel = 'usuario' | 'assistente';
export interface Mensagem { papel: Papel; texto: string }

export type TipoCampo = 'texto' | 'textoLongo' | 'numero' | 'hora' | 'data' | 'select' | 'alternar' | 'semana';

export interface CampoAlvo {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  obrigatorio?: boolean;
  opcoes?: { value: string; label: string }[];
  minimo?: number;
  maximo?: number;
  dica?: string;
}

/** Formulário aberto na tela: o robô devolve valores para estes campos. */
export interface AlvoFormulario {
  tipo: 'formulario';
  /** 'jornada' ou 'cadastro:<chave>'. */
  id: string;
  titulo: string;
  campos: CampoAlvo[];
  valores: Record<string, unknown>;
}

/** Relatório aberto na tela, já em texto: é tudo o que o robô sabe sobre ele. */
export interface AlvoRelatorio {
  tipo: 'relatorio';
  titulo: string;
  filtros: Record<string, string>;
  indicadores: { rotulo: string; valor: string }[];
  colunas: string[];
  linhas: string[][];
  /** Pode ser maior que `linhas.length` (só uma amostra é enviada). */
  totalDeLinhas: number;
}

export type Alvo = AlvoFormulario | AlvoRelatorio;

export interface ContextoTela {
  /** Caminho atual, com os filtros da URL. */
  rota: string;
  /** Primeiro nome de quem está logado. */
  pessoa: string;
  /** Hoje, AAAA-MM-DD. */
  hoje: string;
  /** Telas que a pessoa pode abrir. */
  telas: { titulo: string; para: string }[];
  /** Cadastros que a pessoa pode criar. */
  formularios: { id: string; titulo: string }[];
  alvo: Alvo | null;
}

export type NomeFerramenta = 'preencher_formulario' | 'navegar' | 'abrir_formulario';

export interface PedidoAssistente {
  mensagens: Mensagem[];
  contexto: ContextoTela;
  /** Só as ferramentas que a pessoa pode usar nesta tela. */
  ferramentas: NomeFerramenta[];
}

export type Acao =
  | { tipo: 'preencher'; campos: Record<string, unknown> }
  | { tipo: 'navegar'; rota: string }
  | { tipo: 'abrir_formulario'; formulario: string };

export interface RespostaAssistente {
  texto: string;
  acoes: Acao[];
  /** Resposta do modo de demonstração (sem IA conectada). */
  simulado?: boolean;
}

export type Provedor = 'anthropic' | 'openai' | 'gemini';
export const PROVEDORES: Provedor[] = ['anthropic', 'openai', 'gemini'];

export type MotivoDeErro = 'sem-chave' | 'configuracao' | 'chave-recusada' | 'limite' | 'indisponivel';
