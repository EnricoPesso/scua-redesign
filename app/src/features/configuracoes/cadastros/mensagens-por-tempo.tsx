import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { SimNao, baseDe } from './comum';

export interface MensagemPorTempo { id: string; minutosAntes: number; mensagem: string; segundos: number; ativa: boolean }

const t = (n: number, minutosAntes: number, mensagem: string, segundos: number, ativa = true): MensagemPorTempo => ({ id: `mpt-${n}`, minutosAntes, mensagem, segundos, ativa });

export const mensagensPorTempo = criarColecao<MensagemPorTempo>(
  'mpt',
  () => [
    t(1, 60, 'Sua jornada termina em 1 hora. Organize suas entregas do dia.', 8),
    t(2, 30, 'Faltam 30 minutos para o fim da sua jornada.', 8),
    t(3, 15, 'Faltam 15 minutos para o fim da sua jornada. Comece a salvar o que está em andamento.', 10),
    t(4, 10, 'Faltam 10 minutos para o fim da sua jornada. Salve o seu trabalho.', 10),
    t(5, 5, 'Faltam 5 minutos para o fim da sua jornada. Salve o seu trabalho agora.', 15),
    t(6, 2, 'Sua jornada termina em 2 minutos. Esta estação será bloqueada.', 20),
    t(7, 1, 'Último minuto. Salve o que for preciso, a estação será bloqueada.', 20),
    t(8, 45, 'Faltam 45 minutos para o fim da sua jornada.', 8, false),
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && i.minutosAntes === d.minutosAntes) ? `Já existe um aviso para ${d.minutosAntes} minutos antes do fim.` : undefined),
);

export const configMensagensPorTempo: ConfigCadastro<MensagemPorTempo> = {
  ...baseDe('mensagens-por-tempo'),
  singular: 'aviso por tempo',
  genero: 'o',
  colecao: mensagensPorTempo,
  colunas: [
    { key: 'minutosAntes', header: 'Minutos antes do fim', numeric: true },
    { key: 'mensagem', header: 'Mensagem', render: (i) => <span className="block min-w-64 max-w-xl whitespace-normal">{i.mensagem}</span> },
    { key: 'segundos', header: 'Tempo na tela (s)', numeric: true },
    { key: 'ativa', header: 'Ativa', render: (i) => <SimNao valor={i.ativa} /> },
  ],
  campos: [
    { chave: 'minutosAntes', rotulo: 'Minutos antes do fim da jornada', tipo: 'numero', obrigatorio: true, minimo: 1, maximo: 480 },
    { chave: 'mensagem', rotulo: 'Mensagem', tipo: 'textoLongo', obrigatorio: true, maximo: 300 },
    { chave: 'segundos', rotulo: 'Tempo na tela (segundos)', tipo: 'numero', obrigatorio: true, minimo: 1, maximo: 600 },
    { chave: 'ativa', rotulo: 'Ativa', tipo: 'alternar' },
  ],
  novo: () => ({ minutosAntes: 10, mensagem: '', segundos: 10, ativa: true }),
  nomeDe: (i) => `${i.minutosAntes} minutos antes do fim`,
};
