import { Badge } from '@/components/ui/badge';
import type { ConfigCadastro } from '../../componentes/cadastro/tipos';
import { perfisDePausas, type PerfilPausas } from './api';
import { resumoDasPausas } from './domain/resumo';

const sim = (v: boolean) => (v ? 'Sim' : 'Não');

export const configPausas: ConfigCadastro<PerfilPausas> = {
  chave: 'pausas',
  titulo: 'Pausas',
  descricao: 'Perfis de pausa que podem ser atribuídos às pessoas.',
  trilha: [],
  singular: 'perfil de pausas',
  genero: 'o',
  colecao: perfisDePausas,
  colunas: [
    { key: 'nome', header: 'Perfil' },
    { key: 'resumo', header: 'Pausas', render: (p) => resumoDasPausas(p.quantidade, p.minutos) },
    { key: 'tolerancia', header: 'Tolerância', render: (p) => `${p.tolerancia} min` },
    { key: 'bloqueia', header: 'Bloqueia a estação', render: (p) => sim(p.bloqueiaEstacao) },
    { key: 'ativo', header: 'Situação', render: (p) => <Badge status={p.ativo ? 'success' : 'neutral'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge> },
  ],
  campos: [
    { chave: 'nome', rotulo: 'Nome do perfil', tipo: 'texto', obrigatorio: true, maximo: 60 },
    { chave: 'quantidade', rotulo: 'Pausas por dia', tipo: 'numero', obrigatorio: true, minimo: 1, maximo: 20 },
    { chave: 'minutos', rotulo: 'Duração de cada pausa (minutos)', tipo: 'numero', obrigatorio: true, minimo: 1, maximo: 240 },
    { chave: 'tolerancia', rotulo: 'Tolerância (minutos)', tipo: 'numero', obrigatorio: true, minimo: 0, maximo: 60, dica: 'Quanto a pausa pode passar do tempo antes de ser registrada como excesso.' },
    { chave: 'bloqueiaEstacao', rotulo: 'Bloquear a estação durante a pausa', tipo: 'alternar' },
    { chave: 'ativo', rotulo: 'Ativo', tipo: 'alternar' },
  ],
  novo: () => ({ nome: '', quantidade: 2, minutos: 15, tolerancia: 5, bloqueiaEstacao: false, ativo: true }),
  nomeDe: (p) => p.nome,
  textoDeBusca: (p) => p.nome,
};
