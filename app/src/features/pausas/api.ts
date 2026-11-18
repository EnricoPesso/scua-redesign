import { criarColecao } from '../../mock/colecao';
import { nomeJaExiste } from './domain/resumo';

export interface PerfilPausas {
  id: string;
  nome: string;
  quantidade: number;
  minutos: number;
  tolerancia: number;
  bloqueiaEstacao: boolean;
  ativo: boolean;
}

export const perfisDePausas = criarColecao<PerfilPausas>(
  'pausa',
  () => [
    { id: 'pausa-1', nome: 'Pausas Comercial', quantidade: 2, minutos: 15, tolerancia: 5, bloqueiaEstacao: true, ativo: true },
    { id: 'pausa-2', nome: 'Pausas Suporte', quantidade: 3, minutos: 10, tolerancia: 3, bloqueiaEstacao: false, ativo: true },
    { id: 'pausa-3', nome: 'Pausa de almoço estendido', quantidade: 1, minutos: 90, tolerancia: 10, bloqueiaEstacao: true, ativo: false },
  ],
  (dados, itens, id) => (nomeJaExiste(dados.nome, itens, id) ? 'Já existe um perfil de pausas com esse nome. Use outro nome.' : undefined),
);
