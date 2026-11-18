import { ErroDeValidacao } from '../../mock/colecao';
import { rede } from '../../mock/rede';
import { validarJornada, temErros } from './domain/validacao';
import { DIAS, type DadosJornada, type HorarioDia, type Jornada, type Semana } from './domain/tipos';

const folga: HorarioDia = { trabalha: false, entrada: '', saida: '', intervaloInicio: '', intervaloFim: '' };
const util = (entrada: string, saida: string, ini = '', fim = ''): HorarioDia => ({ trabalha: true, entrada, saida, intervaloInicio: ini, intervaloFim: fim });

/** Monta a semana a partir dos dias que trabalham; os outros ficam de folga. */
const semana = (dias: Partial<Semana>): Semana =>
  Object.fromEntries(DIAS.map((d) => [d, dias[d] ?? { ...folga }])) as Semana;
const diasUteis = (h: HorarioDia): Partial<Semana> => ({ seg: h, ter: h, qua: h, qui: h, sex: h });

/**
 * Jornadas de exemplo. Os ids e identificadores são os mesmos que a feature de usuários usa
 * para a jornada de cada pessoa (ela guarda só o id e o nome).
 */
const semente = (): Jornada[] => [
  { id: 'jor-adm-8h', identificador: 'ADM-8H', descricao: 'Administrativa, 8 horas por dia', tipo: 'Administrativa', ativa: true, padrao: true, liberaRegra: false, informativa: false, semana: semana(diasUteis(util('08:00', '17:00', '12:00', '13:00'))) },
  { id: 'jor-adm-6h', identificador: 'ADM-6H', descricao: 'Meio período, 6 horas corridas', tipo: 'Parcial', ativa: true, padrao: false, liberaRegra: false, informativa: false, semana: semana(diasUteis(util('08:00', '14:00'))) },
  { id: 'jor-com-44h', identificador: 'COM-44H', descricao: 'Comercial com sábado de manhã', tipo: 'Comercial', ativa: true, padrao: false, liberaRegra: false, informativa: false, semana: semana({ ...diasUteis(util('08:00', '17:00', '12:00', '13:00')), sab: util('08:00', '12:00') }) },
  { id: 'jor-turno-a', identificador: 'TURNO-A', descricao: 'Turno da manhã', tipo: 'Turno', ativa: true, padrao: false, liberaRegra: true, informativa: false, semana: semana(diasUteis(util('06:00', '14:00', '09:30', '10:00'))) },
  { id: 'jor-turno-b', identificador: 'TURNO-B', descricao: 'Turno da tarde (desativado)', tipo: 'Turno', ativa: false, padrao: false, liberaRegra: true, informativa: false, semana: semana(diasUteis(util('14:00', '22:00', '18:00', '18:30'))) },
  { id: 'jor-plantao', identificador: 'PLANTAO-FDS', descricao: 'Plantão de fim de semana', tipo: 'Plantão', ativa: true, padrao: false, liberaRegra: true, informativa: false, semana: semana({ sab: util('08:00', '20:00', '12:00', '13:00'), dom: util('08:00', '20:00', '12:00', '13:00') }) },
  { id: 'jor-livre', identificador: 'LIVRE-INFO', descricao: 'Horário livre, só para registro', tipo: 'Flexível', ativa: true, padrao: false, liberaRegra: false, informativa: true, semana: semana(diasUteis(util('09:00', '18:00', '12:00', '13:00'))) },
];

let guardadas: Jornada[] | null = null;
let seq = 0;
const carregar = (): Jornada[] => {
  if (guardadas === null) {
    guardadas = structuredClone(semente());
    seq = guardadas.length;
  }
  return guardadas;
};

export function listarJornadas(): Promise<Jornada[]> {
  return rede(() => carregar());
}

/** Cria (id nulo) ou edita. Marcar como padrão tira o padrão das outras. */
export function salvarJornada(id: string | null, dados: DadosJornada): Promise<Jornada> {
  return rede(() => {
    const todas = carregar();
    if (temErros(validarJornada(dados, todas, id ?? undefined))) throw new ErroDeValidacao('Corrija os campos destacados e tente de novo.');
    const limpa: DadosJornada = { ...dados, identificador: dados.identificador.trim(), descricao: dados.descricao.trim() };
    let salva: Jornada;
    if (id === null) {
      seq += 1;
      salva = { ...limpa, id: `jor-${seq}` };
    } else {
      if (!todas.some((j) => j.id === id)) throw new ErroDeValidacao('Esta jornada não existe mais.');
      salva = { ...limpa, id };
    }
    const base = id === null ? [...todas, salva] : todas.map((j) => (j.id === id ? salva : j));
    guardadas = salva.padrao ? base.map((j) => (j.id === salva.id ? j : { ...j, padrao: false })) : base;
    return salva;
  });
}

export function excluirJornada(id: string): Promise<void> {
  return rede(() => {
    const alvo = carregar().find((j) => j.id === id);
    if (alvo?.padrao) throw new ErroDeValidacao(`${alvo.identificador} é a jornada padrão e não pode ser excluída. Marque outra jornada como padrão primeiro.`);
    guardadas = carregar().filter((j) => j.id !== id);
  });
}

/** Volta aos dados de exemplo (usado nos testes). */
export function resetarJornadas(): void {
  guardadas = null;
}
