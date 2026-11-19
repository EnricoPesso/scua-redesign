import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { SimNao, baseDe, mesmoTexto } from './comum';

export interface TipoDeJornada { id: string; nome: string; descricao: string; ativo: boolean }

export const tiposDeJornada = criarColecao<TipoDeJornada>(
  'tj',
  () => [
    { id: 'tj-1', nome: 'Administrativa', descricao: 'Jornada fixa em horário comercial, de segunda a sexta.', ativo: true },
    { id: 'tj-2', nome: 'Turno', descricao: 'Jornada em turnos que se revezam entre manhã, tarde e noite.', ativo: true },
    { id: 'tj-3', nome: 'Escala 12x36', descricao: 'Doze horas de trabalho seguidas de trinta e seis de descanso.', ativo: true },
    { id: 'tj-4', nome: 'Home office', descricao: 'Jornada cumprida fora da empresa, com registro pela estação remota.', ativo: false },
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && mesmoTexto(i.nome, d.nome)) ? 'Já existe um tipo de jornada com esse nome.' : undefined),
);

export const configTiposDeJornada: ConfigCadastro<TipoDeJornada> = {
  ...baseDe('tipos-de-jornada'),
  singular: 'tipo de jornada',
  genero: 'o',
  colecao: tiposDeJornada,
  colunas: [
    { key: 'nome', header: 'Nome' },
    { key: 'descricao', header: 'Descrição' },
    { key: 'ativo', header: 'Ativo', render: (i) => <SimNao valor={i.ativo} /> },
  ],
  campos: [
    { chave: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maximo: 60 },
    { chave: 'descricao', rotulo: 'Descrição', tipo: 'textoLongo', maximo: 200 },
    { chave: 'ativo', rotulo: 'Ativo', tipo: 'alternar', dica: 'Tipos inativos não aparecem para escolha em novos cadastros.' },
  ],
  novo: () => ({ nome: '', descricao: '', ativo: true }),
  nomeDe: (i) => i.nome,
};
