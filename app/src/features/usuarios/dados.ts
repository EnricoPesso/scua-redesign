import { GESTORES, PESSOAS_DIRETORIO } from '../../mock/diretorio';

/** Departamentos que existem na empresa de exemplo, em ordem alfabética. */
export const DEPARTAMENTOS: string[] = [...new Set(PESSOAS_DIRETORIO.map((p) => p.departamento))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
export const GESTORES_IDS: string[] = GESTORES.map((g) => g.id);

/**
 * Jornadas que podem ser atribuídas a uma pessoa. Esta feature guarda só o id e o nome da jornada
 * (não importa a feature de jornadas): os ids são os mesmos da semente de `features/jornadas/api.ts`.
 * Quando houver API, vira uma chamada que lista as jornadas ativas.
 */
export const JORNADAS_ATRIBUIVEIS: { id: string; nome: string }[] = [
  { id: 'jor-adm-8h', nome: 'ADM-8H' },
  { id: 'jor-adm-6h', nome: 'ADM-6H' },
  { id: 'jor-com-44h', nome: 'COM-44H' },
  { id: 'jor-turno-a', nome: 'TURNO-A' },
  { id: 'jor-plantao', nome: 'PLANTAO-FDS' },
  { id: 'jor-livre', nome: 'LIVRE-INFO' },
];
