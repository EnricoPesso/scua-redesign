import type { ColunaPlanilha } from '@/lib/planilha';
import { nomeDe } from '../../mock/diretorio';
import type { Usuario } from './domain/tipos';

/** Colunas da planilha de Usuários: as mesmas da lista, mais a matrícula. */
export const COLUNAS_PLANILHA: ColunaPlanilha<Usuario>[] = [
  { header: 'Nome', texto: (u) => u.nome },
  { header: 'Login', texto: (u) => u.login },
  { header: 'Matrícula', texto: (u) => u.matricula },
  { header: 'Gestor', texto: (u) => (u.gestorId ? nomeDe(u.gestorId) : '') },
  { header: 'Departamento', texto: (u) => u.departamento },
  { header: 'Jornada', texto: (u) => u.jornadaNome },
  { header: 'Situação', texto: (u) => (u.ativo ? 'Ativo' : 'Inativo') },
];
