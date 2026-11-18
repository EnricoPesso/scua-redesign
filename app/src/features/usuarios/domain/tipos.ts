export type Calendario = 'nacional' | 'estadual' | 'municipal';
export const CALENDARIOS: { valor: Calendario; rotulo: string; dica: string }[] = [
  { valor: 'nacional', rotulo: 'Nacional', dica: 'Feriados de todo o país.' },
  { valor: 'estadual', rotulo: 'Estadual', dica: 'Feriados do estado onde a pessoa trabalha.' },
  { valor: 'municipal', rotulo: 'Municipal', dica: 'Feriados da cidade onde a pessoa trabalha.' },
];

export interface Permissoes {
  avisosPorEmail: boolean;
  liberaRegra: boolean;
  administrador: boolean;
  rhAprovador: boolean;
  sustentacao: boolean;
  producao: boolean;
}

export const PERMISSOES: { chave: keyof Permissoes; rotulo: string; dica: string }[] = [
  { chave: 'avisosPorEmail', rotulo: 'Recebe avisos por e-mail', dica: 'Recebe por e-mail os avisos de pedidos de extensão e de bloqueios.' },
  { chave: 'liberaRegra', rotulo: 'Pode liberar regra', dica: 'Pode liberar uma regra de bloqueio da estação quando precisar.' },
  { chave: 'administrador', rotulo: 'Administrador', dica: 'Acessa as configurações e a administração do sistema.' },
  { chave: 'rhAprovador', rotulo: 'RH aprovador', dica: 'Aprova pedidos de extensão como RH, de qualquer diretoria.' },
  { chave: 'sustentacao', rotulo: 'Sustentação', dica: 'Acompanha o funcionamento do sistema e atende chamados de suporte.' },
  { chave: 'producao', rotulo: 'Produção', dica: 'Atua no ambiente de produção, com as estações e os registros reais.' },
];

/** Quem aprova as extensões no lugar da pessoa, e em qual período (datas YYYY-MM-DD). */
export interface Substituto { pessoaId: string; de: string; ate: string }
export interface Excecao { id: string; data: string; entrada: string; saida: string; motivo: string }
export interface Ferias { id: string; inicio: string; fim: string }

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  matricula: string;
  email: string;
  whatsapp: string;
  gestorId: string | null;
  departamento: string;
  /** Só o id e o nome: a jornada em si pertence à feature de jornadas. */
  jornadaId: string;
  jornadaNome: string;
  ativo: boolean;
  permissoes: Permissoes;
  feriados: Calendario[];
  substituto: Substituto | null;
  excecoes: Excecao[];
  ferias: Ferias[];
}

/** O que a aba "Dados" edita. */
export interface DadosUsuario {
  email: string;
  whatsapp: string;
  gestorId: string | null;
  departamento: string;
  jornadaId: string;
  permissoes: Permissoes;
}

export type NovaExcecao = Omit<Excecao, 'id'>;
export type NovasFerias = Omit<Ferias, 'id'>;

export const ABAS = ['dados', 'feriados', 'substituto', 'excecoes', 'ferias'] as const;
export type Aba = (typeof ABAS)[number];
export const ROTULO_ABA: Record<Aba, string> = { dados: 'Dados', feriados: 'Feriados', substituto: 'Substituto', excecoes: 'Exceções', ferias: 'Férias' };
export const ehAba = (v: string | undefined): v is Aba => ABAS.includes(v as Aba);
