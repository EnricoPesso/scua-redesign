import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { SimNao, baseDe } from './comum';

export interface Notificacao { id: string; acontecimento: string; descricao: string; email: boolean; whatsapp: boolean; teams: boolean }

const n = (i: number, acontecimento: string, descricao: string, email: boolean, whatsapp: boolean, teams: boolean): Notificacao => ({ id: `not-${i}`, acontecimento, descricao, email, whatsapp, teams });

// Lista fixa do sistema. No sistema atual cada item aparece como um código técnico (EVT_*); aqui só o nome amigável.
export const NOTIFICACOES_INICIAIS: Notificacao[] = [
  n(1, 'Extensão de jornada pedida', 'Uma pessoa pediu extensão de jornada e o pedido aguarda resposta do gestor.', true, true, false),
  n(2, 'Extensão aprovada', 'O gestor aprovou um pedido de extensão de jornada.', true, true, false),
  n(3, 'Extensão reprovada', 'O gestor reprovou um pedido de extensão de jornada.', true, false, false),
  n(4, 'Extensão pendente há muito tempo', 'Um pedido de extensão está sem resposta há mais de dois dias.', true, false, true),
  n(5, 'Limite mensal de extensão atingido', 'O grupo chegou ao limite mensal de horas de extensão.', true, false, true),
  n(6, 'Tentativa de acesso fora da jornada', 'Uma pessoa tentou usar uma estação fora do horário da sua jornada.', true, false, true),
  n(7, 'Usuário bloqueado no domínio', 'Um usuário foi bloqueado (desabilitado) no domínio de rede.', true, false, true),
  n(8, 'Usuário desbloqueado no domínio', 'Um usuário foi desbloqueado (habilitado) no domínio de rede.', true, false, false),
  n(9, 'Estação sem agente', 'Uma estação do domínio está sem o agente do Scua Logon instalado.', true, false, true),
  n(10, 'Fim de jornada próximo', 'A jornada de uma pessoa está perto do fim e ela ainda está na estação.', false, false, true),
  n(11, 'Falha na sincronização do domínio', 'A sincronização automática de um domínio não terminou.', true, false, true),
  n(12, 'Estação inativa', 'Uma estação ficou sem comunicar com o servidor por vários dias.', true, false, false),
];

export const notificacoes = criarColecao<Notificacao>('not', () => NOTIFICACOES_INICIAIS);

export const configNotificacoes: ConfigCadastro<Notificacao> = {
  ...baseDe('notificacoes'),
  singular: 'notificação',
  genero: 'a',
  colecao: notificacoes,
  podeCriar: false,
  podeExcluir: false,
  colunas: [
    { key: 'acontecimento', header: 'Acontecimento' },
    { key: 'descricao', header: 'Quando acontece', render: (i) => <span className="block min-w-64 max-w-md whitespace-normal">{i.descricao}</span> },
    { key: 'email', header: 'E-mail', render: (i) => <SimNao valor={i.email} /> },
    { key: 'whatsapp', header: 'WhatsApp', render: (i) => <SimNao valor={i.whatsapp} /> },
    { key: 'teams', header: 'Teams', render: (i) => <SimNao valor={i.teams} /> },
  ],
  campos: [
    { chave: 'acontecimento', rotulo: 'Acontecimento', tipo: 'texto', fixoAoEditar: true },
    { chave: 'descricao', rotulo: 'Descrição', tipo: 'textoLongo', obrigatorio: true, maximo: 200 },
    { chave: 'email', rotulo: 'Avisar por e-mail', tipo: 'alternar' },
    { chave: 'whatsapp', rotulo: 'Avisar por WhatsApp', tipo: 'alternar' },
    { chave: 'teams', rotulo: 'Avisar por Teams', tipo: 'alternar' },
  ],
  novo: () => ({ acontecimento: '', descricao: '', email: false, whatsapp: false, teams: false }),
  nomeDe: (i) => i.acontecimento,
  textoDeBusca: (i) => `${i.acontecimento} ${i.descricao}`,
};
