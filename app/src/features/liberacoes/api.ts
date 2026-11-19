import { criarColecao } from '../../mock/colecao';
import { dia } from '../../mock/datas';
import { conflitoDaLiberacao, type DadosLiberacao } from './domain/liberacao';

export interface Liberacao extends DadosLiberacao { id: string }

const l = (id: number, diretoria: string, area: string, de: number, ate: number, horaDe: string, horaAte: string, motivo: string): Liberacao =>
  ({ id: `lib-${id}`, diretoria, area, de: dia(de), ate: dia(ate), horaDe, horaAte, motivo });

export const liberacoes = criarColecao<Liberacao>(
  'lib',
  () => [
    l(1, 'Comercial', '', -2, 5, '', '', 'Feira de negócios fora do escritório'),
    l(2, 'Tecnologia', 'Infraestrutura', 10, 12, '22:00', '23:59', 'Migração de servidores à noite'),
    l(3, 'Financeiro', '', 30, 33, '', '', 'Fechamento anual'),
    l(4, 'Operações', 'Logística', -30, -26, '', '', 'Inventário geral'),
    l(5, 'Pessoas', '', -14, -12, '08:00', '12:00', 'Treinamento de integração'),
  ],
  (dados, itens, id) => conflitoDaLiberacao(dados, itens, id),
);
