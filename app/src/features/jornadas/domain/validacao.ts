import { paraMinutos } from './horario';
import { DIAS, type Dia, type DadosJornada, type HorarioDia, type Jornada } from './tipos';

export interface ErrosDia { entrada?: string; saida?: string; intervaloInicio?: string; intervaloFim?: string }
export interface ErrosJornada {
  identificador?: string;
  descricao?: string;
  tipo?: string;
  padrao?: string;
  /** Problema da semana como um todo (ex.: nenhum dia de trabalho). */
  semana?: string;
  dias: Partial<Record<Dia, ErrosDia>>;
}

export function temErros(e: ErrosJornada): boolean {
  return Boolean(e.identificador || e.descricao || e.tipo || e.padrao || e.semana || Object.keys(e.dias).length > 0);
}

const normalizar = (t: string) => t.trim().toLowerCase();

/** Erros do dia de trabalho: entrada e saída preenchidas, saída depois da entrada, intervalo inteiro e dentro do expediente. */
export function validarDia(d: HorarioDia): ErrosDia {
  const erros: ErrosDia = {};
  if (!d.trabalha) return erros;
  const entrada = paraMinutos(d.entrada);
  const saida = paraMinutos(d.saida);
  if (entrada === null) erros.entrada = 'Informe a entrada';
  if (saida === null) erros.saida = 'Informe a saída';
  if (entrada !== null && saida !== null && saida <= entrada) erros.saida = 'A saída precisa ser depois da entrada';

  const ini = paraMinutos(d.intervaloInicio);
  const fim = paraMinutos(d.intervaloFim);
  if (ini === null && fim === null) return erros;
  if (ini === null) erros.intervaloInicio = 'Informe o início do intervalo';
  else if (fim === null) erros.intervaloFim = 'Informe o fim do intervalo';
  else if (fim <= ini) erros.intervaloFim = 'O fim precisa ser depois do início';
  else if (entrada !== null && saida !== null && (ini < entrada || fim > saida)) erros.intervaloFim = 'O intervalo precisa ficar dentro do expediente';
  return erros;
}

/** `outras` são as jornadas existentes (para conferir que o identificador é único); `idAtual` é a que está sendo editada. */
export function validarJornada(dados: DadosJornada, outras: Pick<Jornada, 'id' | 'identificador'>[], idAtual?: string): ErrosJornada {
  const erros: ErrosJornada = { dias: {} };
  const identificador = dados.identificador.trim();
  if (!identificador) erros.identificador = 'Informe o identificador';
  else if (!/^[A-Za-z0-9_-]+$/.test(identificador)) erros.identificador = 'Use só letras, números, hífen e sublinhado';
  else if (identificador.length > 20) erros.identificador = 'Use no máximo 20 caracteres';
  else if (outras.some((o) => o.id !== idAtual && normalizar(o.identificador) === normalizar(identificador))) erros.identificador = 'Já existe uma jornada com este identificador';
  if (!dados.descricao.trim()) erros.descricao = 'Informe a descrição';
  if (!dados.tipo) erros.tipo = 'Escolha o tipo';
  if (dados.padrao && !dados.ativa) erros.padrao = 'A jornada padrão precisa estar ativa';
  if (!DIAS.some((d) => dados.semana[d].trabalha)) erros.semana = 'Marque pelo menos um dia de trabalho';
  for (const dia of DIAS) {
    const e = validarDia(dados.semana[dia]);
    if (Object.keys(e).length > 0) erros.dias[dia] = e;
  }
  return erros;
}
