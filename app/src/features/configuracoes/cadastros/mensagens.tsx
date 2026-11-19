import { Badge, type BadgeProps } from '@/components/ui/badge';
import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { baseDe, opcoes } from './comum';

export interface Mensagem { id: string; codigo: string; tipo: string; mensagem: string; segundos: number }

const STATUS_DO_TIPO: Record<string, NonNullable<BadgeProps['status']>> = { Aviso: 'info', Bloqueio: 'danger', Liberação: 'success', Erro: 'warning' };

const m = (n: number, codigo: string, tipo: string, mensagem: string, segundos: number): Mensagem => ({ id: `msg-${n}`, codigo, tipo, mensagem, segundos });

// Lista fixa do sistema: só o texto e o tempo na tela mudam.
export const mensagens = criarColecao<Mensagem>('msg', () => [
  m(1, 'Bloqueio por fim de jornada', 'Bloqueio', 'Sua jornada terminou e esta estação foi bloqueada. Para continuar, peça uma extensão de jornada ao seu gestor.', 30),
  m(2, 'Bloqueio por acesso fora da jornada', 'Bloqueio', 'Você ainda não pode usar esta estação. O acesso é liberado no início da sua jornada.', 30),
  m(3, 'Bloqueio por falta de licença', 'Bloqueio', 'Não há licença disponível para este acesso. Fale com o TI da sua empresa.', 20),
  m(4, 'Bloqueio por usuário desabilitado', 'Bloqueio', 'Seu usuário está desabilitado. Fale com o RH ou com o TI para entender o motivo.', 20),
  m(5, 'Aviso de fim de jornada próximo', 'Aviso', 'Sua jornada termina em instantes. Salve o seu trabalho. Se precisar de mais tempo, peça uma extensão.', 15),
  m(6, 'Aviso de extensão prestes a acabar', 'Aviso', 'Sua extensão de jornada está acabando. Salve o seu trabalho.', 15),
  m(7, 'Aviso de pedido enviado', 'Aviso', 'Seu pedido de extensão foi enviado ao gestor. Você será avisado quando ele responder.', 10),
  m(8, 'Aviso de pedido pendente', 'Aviso', 'Seu pedido de extensão ainda aguarda resposta do gestor.', 10),
  m(9, 'Aviso de pausa recomendada', 'Aviso', 'Você está há muitas horas na estação. Que tal uma pausa rápida?', 10),
  m(10, 'Aviso de jornada com saldo alto', 'Aviso', 'Você está perto do limite mensal de extensão do seu grupo.', 15),
  m(11, 'Liberação por extensão aprovada', 'Liberação', 'Sua extensão de jornada foi aprovada. Bom trabalho!', 10),
  m(12, 'Liberação por início de jornada', 'Liberação', 'Sua jornada começou. Esta estação está liberada.', 8),
  m(13, 'Liberação manual pelo gestor', 'Liberação', 'Seu gestor liberou o acesso a esta estação.', 10),
  m(14, 'Liberação temporária', 'Liberação', 'Acesso liberado por tempo limitado. Combine com seu gestor a extensão de jornada.', 10),
  m(15, 'Liberação por ausência encerrada', 'Liberação', 'Sua ausência terminou e o acesso foi liberado.', 8),
  m(16, 'Erro de comunicação com o servidor', 'Erro', 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.', 20),
  m(17, 'Erro de usuário não encontrado', 'Erro', 'Seu usuário não foi encontrado. Fale com o TI da sua empresa.', 20),
  m(18, 'Erro de pedido reprovado', 'Erro', 'Seu pedido de extensão foi reprovado. Veja o motivo com seu gestor.', 15),
  m(19, 'Erro de extensão fora do limite', 'Erro', 'Este pedido passa do limite de extensão permitido. Peça um período menor.', 15),
  m(20, 'Erro de estação não reconhecida', 'Erro', 'Esta estação não está cadastrada no Scua Logon. Fale com o TI.', 20),
]);

export const configMensagens: ConfigCadastro<Mensagem> = {
  ...baseDe('mensagens'),
  singular: 'mensagem',
  genero: 'a',
  colecao: mensagens,
  podeCriar: false,
  podeExcluir: false,
  colunas: [
    { key: 'codigo', header: 'Mensagem do sistema' },
    { key: 'tipo', header: 'Tipo', render: (i) => <Badge status={STATUS_DO_TIPO[i.tipo] ?? 'neutral'}>{i.tipo}</Badge> },
    { key: 'mensagem', header: 'Texto na estação', render: (i) => <span className="block min-w-64 max-w-xl whitespace-normal">{i.mensagem}</span> },
    { key: 'segundos', header: 'Tempo na tela (s)', numeric: true },
  ],
  campos: [
    { chave: 'codigo', rotulo: 'Mensagem do sistema', tipo: 'texto', fixoAoEditar: true },
    { chave: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: opcoes('Aviso', 'Bloqueio', 'Liberação', 'Erro'), fixoAoEditar: true },
    { chave: 'mensagem', rotulo: 'Texto na estação', tipo: 'textoLongo', obrigatorio: true, maximo: 300, dica: 'É o que a pessoa lê na tela da estação. Prefira frases curtas e diga o que fazer.' },
    { chave: 'segundos', rotulo: 'Tempo na tela (segundos)', tipo: 'numero', obrigatorio: true, minimo: 1, maximo: 600 },
  ],
  novo: () => ({ codigo: '', tipo: 'Aviso', mensagem: '', segundos: 10 }),
  nomeDe: (i) => i.codigo,
  textoDeBusca: (i) => `${i.codigo} ${i.tipo} ${i.mensagem}`,
};
