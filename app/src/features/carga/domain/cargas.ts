import { gerarCsv } from './csv';

export type TipoCampo = 'texto' | 'data' | 'hora' | 'login' | 'telefone' | 'diretoria';

export interface ColunaCarga {
  nome: string;
  tipo: TipoCampo;
  /** Valor da linha de exemplo do modelo. */
  exemplo: string;
}

/** Par de colunas em que o fim precisa vir depois (hora) ou não pode vir antes (data) do início. */
export interface IntervaloCarga {
  inicio: string;
  fim: string;
  tipo: 'data' | 'hora';
}

export interface DefinicaoCarga {
  id: string;
  nome: string;
  descricao: string;
  arquivoModelo: string;
  colunas: ColunaCarga[];
  intervalos: IntervaloCarga[];
}

const login = (nome = 'Login'): ColunaCarga => ({ nome, tipo: 'login', exemplo: 'ana.souza' });
const data = (nome: string, exemplo: string): ColunaCarga => ({ nome, tipo: 'data', exemplo });
const hora = (nome: string, exemplo: string): ColunaCarga => ({ nome, tipo: 'hora', exemplo });
const texto = (nome: string, exemplo: string): ColunaCarga => ({ nome, tipo: 'texto', exemplo });

export const CARGAS: DefinicaoCarga[] = [
  {
    id: 'excecoes-diretoria',
    nome: 'Exceções por diretoria',
    descricao: 'Libera uma diretoria inteira do controle de jornada por um período.',
    arquivoModelo: 'modelo-excecoes-por-diretoria.csv',
    colunas: [{ nome: 'Diretoria', tipo: 'diretoria', exemplo: 'Comercial' }, data('Data inicial', '01/12/2026'), data('Data final', '05/12/2026'), texto('Motivo', 'Evento externo')],
    intervalos: [{ inicio: 'Data inicial', fim: 'Data final', tipo: 'data' }],
  },
  {
    id: 'ferias',
    nome: 'Férias',
    descricao: 'Registra os períodos de férias de várias pessoas de uma vez.',
    arquivoModelo: 'modelo-ferias.csv',
    colunas: [login(), data('Data inicial', '04/01/2027'), data('Data final', '23/01/2027')],
    intervalos: [{ inicio: 'Data inicial', fim: 'Data final', tipo: 'data' }],
  },
  {
    id: 'feriados',
    nome: 'Feriados',
    descricao: 'Cadastra feriados que valem para todas as pessoas.',
    arquivoModelo: 'modelo-feriados.csv',
    colunas: [data('Data', '25/12/2026'), texto('Descrição', 'Natal')],
    intervalos: [],
  },
  {
    id: 'extensoes',
    nome: 'Extensões de jornada',
    descricao: 'Lança extensões de jornada já aprovadas, com dia e horário.',
    arquivoModelo: 'modelo-extensoes-de-jornada.csv',
    colunas: [login(), data('Data', '18/11/2026'), hora('Hora inicial', '18:00'), hora('Hora final', '20:00'), texto('Motivo', 'Fechamento do mês')],
    intervalos: [{ inicio: 'Hora inicial', fim: 'Hora final', tipo: 'hora' }],
  },
  {
    id: 'feriados-usuario',
    nome: 'Feriados por usuário',
    descricao: 'Define feriados que valem só para algumas pessoas, como feriados municipais.',
    arquivoModelo: 'modelo-feriados-por-usuario.csv',
    colunas: [login(), data('Data', '20/01/2027'), texto('Descrição', 'Aniversário da cidade')],
    intervalos: [],
  },
  {
    id: 'telefones',
    nome: 'Telefones para WhatsApp',
    descricao: 'Atualiza o telefone que recebe os avisos pelo WhatsApp.',
    arquivoModelo: 'modelo-telefones-whatsapp.csv',
    colunas: [login(), { nome: 'Telefone', tipo: 'telefone', exemplo: '(11) 98765-4321' }],
    intervalos: [],
  },
];

export const cargaPorId = (id: string): DefinicaoCarga | undefined => CARGAS.find((c) => c.id === id);

/** Conteúdo do arquivo-modelo: cabeçalho e uma linha de exemplo. */
export function gerarModelo(carga: DefinicaoCarga): string {
  return gerarCsv([carga.colunas.map((c) => c.nome), carga.colunas.map((c) => c.exemplo)]);
}
