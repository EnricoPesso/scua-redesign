export const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
export type Dia = (typeof DIAS)[number];

/** Horas no formato "HH:MM". Texto vazio = não informado. */
export interface HorarioDia {
  trabalha: boolean;
  entrada: string;
  saida: string;
  intervaloInicio: string;
  intervaloFim: string;
}

export type Semana = Record<Dia, HorarioDia>;

export interface Jornada {
  id: string;
  /** Código curto e único, como "ADM-8H". */
  identificador: string;
  descricao: string;
  tipo: string;
  ativa: boolean;
  /** Só uma jornada pode ser a padrão. */
  padrao: boolean;
  liberaRegra: boolean;
  /** Só registra os horários, não bloqueia a estação. */
  informativa: boolean;
  semana: Semana;
}

export type DadosJornada = Omit<Jornada, 'id'>;

export const TIPOS_DE_JORNADA = ['Administrativa', 'Comercial', 'Turno', 'Plantão', 'Parcial', 'Flexível'];

export const NOME_CURTO: Record<Dia, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };
export const NOME_LONGO: Record<Dia, string> = {
  seg: 'Segunda-feira', ter: 'Terça-feira', qua: 'Quarta-feira', qui: 'Quinta-feira', sex: 'Sexta-feira', sab: 'Sábado', dom: 'Domingo',
};
export const DIAS_UTEIS: Dia[] = ['seg', 'ter', 'qua', 'qui', 'sex'];
