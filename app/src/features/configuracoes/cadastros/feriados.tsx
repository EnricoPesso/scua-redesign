import { criarColecao } from '../../../mock/colecao';
import { hoje } from '../../../mock/datas';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { dataComDiaDaSemana, feriadosNacionaisDoAno } from '../domain/feriados';
import { baseDe, mesmoTexto, opcoes } from './comum';

export interface Feriado { id: string; data: string; nome: string; calendario: string }

export const feriados = criarColecao<Feriado>(
  'fer',
  () => {
    const ano = Number(hoje().slice(0, 4));
    return [ano, ano + 1]
      .flatMap(feriadosNacionaisDoAno)
      .map((f, i) => ({ id: `fer-${i + 1}`, ...f, calendario: 'Nacional' }));
  },
  (d, itens, id) => (itens.some((i) => i.id !== id && i.data === d.data && mesmoTexto(i.calendario, d.calendario)) ? 'Já existe um feriado nessa data neste calendário.' : undefined),
);

export const configFeriados: ConfigCadastro<Feriado> = {
  ...baseDe('feriados'),
  singular: 'feriado',
  genero: 'o',
  colecao: feriados,
  colunas: [
    { key: 'data', header: 'Data', render: (i) => dataComDiaDaSemana(i.data) },
    { key: 'nome', header: 'Nome' },
    { key: 'calendario', header: 'Calendário' },
  ],
  campos: [
    { chave: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { chave: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maximo: 80 },
    { chave: 'calendario', rotulo: 'Calendário', tipo: 'select', obrigatorio: true, opcoes: opcoes('Nacional', 'Estadual', 'Municipal') },
  ],
  novo: () => ({ data: '', nome: '', calendario: 'Nacional' }),
  nomeDe: (i) => i.nome,
  textoDeBusca: (i) => `${i.nome} ${i.calendario} ${dataComDiaDaSemana(i.data)}`,
  itensPorPagina: 12,
};
