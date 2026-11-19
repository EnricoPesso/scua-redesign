import { Badge } from '@/components/ui/badge';
import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { validarDominio } from '../domain/rede';
import { SimNao, baseDe, mesmoTexto, opcoes } from './comum';

export interface Dominio { id: string; identificador: string; dominio: string; categoria: string; sincronizar: boolean; instalarAgente: boolean }

export const dominios = criarColecao<Dominio>(
  'dom',
  () => [
    { id: 'dom-1', identificador: 'Matriz', dominio: 'scua.local', categoria: 'Produção', sincronizar: true, instalarAgente: true },
    { id: 'dom-2', identificador: 'Laboratório de testes', dominio: 'homolog.scua.local', categoria: 'Homologação', sincronizar: false, instalarAgente: false },
  ],
  (d, itens, id) => {
    const outros = itens.filter((i) => i.id !== id);
    if (outros.some((i) => mesmoTexto(i.identificador, d.identificador))) return 'Já existe um domínio com esse identificador.';
    if (outros.some((i) => mesmoTexto(i.dominio, d.dominio))) return 'Esse domínio já está cadastrado.';
    return undefined;
  },
);

export const configDominios: ConfigCadastro<Dominio> = {
  ...baseDe('dominios'),
  singular: 'domínio',
  genero: 'o',
  colecao: dominios,
  colunas: [
    { key: 'identificador', header: 'Identificador' },
    { key: 'dominio', header: 'Domínio' },
    { key: 'categoria', header: 'Categoria', render: (i) => <Badge status={i.categoria === 'Produção' ? 'info' : 'neutral'}>{i.categoria}</Badge> },
    { key: 'sincronizar', header: 'Sincronização automática', render: (i) => <SimNao valor={i.sincronizar} /> },
    { key: 'instalarAgente', header: 'Instalar agente automaticamente', render: (i) => <SimNao valor={i.instalarAgente} /> },
  ],
  campos: [
    { chave: 'identificador', rotulo: 'Identificador', tipo: 'texto', obrigatorio: true, maximo: 60, dica: 'Um nome para reconhecer este domínio, como Matriz.' },
    { chave: 'dominio', rotulo: 'Domínio', tipo: 'texto', obrigatorio: true, maximo: 120, dica: 'O nome do domínio de rede, como scua.local.' },
    { chave: 'categoria', rotulo: 'Categoria', tipo: 'select', obrigatorio: true, opcoes: opcoes('Produção', 'Homologação') },
    { chave: 'sincronizar', rotulo: 'Sincronização automática', tipo: 'alternar', dica: 'Mantém os usuários do domínio atualizados sem precisar pedir.' },
    { chave: 'instalarAgente', rotulo: 'Instalar agente automaticamente', tipo: 'alternar', dica: 'Instala o agente do Scua Logon nas estações novas do domínio.' },
  ],
  novo: () => ({ identificador: '', dominio: '', categoria: 'Produção', sincronizar: true, instalarAgente: false }),
  nomeDe: (i) => i.identificador,
  validar: (d) => (d.dominio.trim() && validarDominio(d.dominio) ? { dominio: validarDominio(d.dominio) } : {}),
};
