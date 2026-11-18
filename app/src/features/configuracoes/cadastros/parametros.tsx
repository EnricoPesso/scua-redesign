import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { baseDe } from './comum';

export interface Parametro { id: string; nome: string; valor: string; descricao: string }

const p = (n: number, nome: string, valor: string, descricao: string): Parametro => ({ id: `par-${n}`, nome, valor, descricao });

// Lista fixa do sistema: só o valor muda.
export const parametros = criarColecao<Parametro>('par', () => [
  p(1, 'Tolerância de entrada (minutos)', '10', 'Quanto a pessoa pode chegar depois do início da jornada sem contar como atraso.'),
  p(2, 'Tolerância de saída (minutos)', '10', 'Quanto a pessoa pode ficar depois do fim da jornada sem contar como extensão.'),
  p(3, 'Aviso antes do fim da jornada (minutos)', '15', 'Com quantos minutos de antecedência a estação avisa que a jornada vai terminar.'),
  p(4, 'Dias para considerar estação inativa', '30', 'Depois de quantos dias sem comunicar uma estação passa a ser considerada inativa.'),
  p(5, 'Duração máxima de uma extensão (horas)', '4', 'O maior período que uma pessoa pode pedir em uma única extensão de jornada.'),
  p(6, 'Prazo para aprovar uma extensão (dias)', '3', 'Depois deste prazo sem resposta, o pedido aparece como atrasado para o gestor.'),
  p(7, 'Dias para pedir extensão retroativa', '2', 'Até quantos dias depois a pessoa ainda pode registrar uma extensão que já aconteceu.'),
  p(8, 'Tempo sem atividade para encerrar a sessão (minutos)', '30', 'Depois deste tempo parado, a sessão da pessoa no Scua Logon é encerrada.'),
  p(9, 'Intervalo de comunicação do agente (segundos)', '60', 'De quanto em quanto tempo o agente da estação avisa o servidor que está funcionando.'),
  p(10, 'Dias de guarda dos eventos', '365', 'Por quanto tempo os eventos das estações ficam disponíveis nos relatórios.'),
  p(11, 'Bloquear a estação ao fim da jornada', 'Sim', 'Quando ligado, a estação é bloqueada assim que a jornada termina e não há extensão aprovada.'),
  p(12, 'Horário do resumo diário para gestores', '08:00', 'A que horas o gestor recebe o resumo dos pedidos pendentes.'),
  p(13, 'Fuso horário padrão', 'America/Sao_Paulo', 'Fuso usado nos horários de jornada, relatórios e avisos.'),
  p(14, 'Idioma padrão', 'Português (BR)', 'Idioma dos textos mostrados na estação e nos avisos.'),
  p(15, 'Tentativas fora da jornada antes de avisar', '5', 'Quantas tentativas de acesso fora da jornada geram um aviso ao gestor.'),
]);

export const configParametros: ConfigCadastro<Parametro> = {
  ...baseDe('parametros'),
  singular: 'parâmetro',
  genero: 'o',
  colecao: parametros,
  podeCriar: false,
  podeExcluir: false,
  colunas: [
    { key: 'nome', header: 'Parâmetro' },
    { key: 'valor', header: 'Valor' },
    { key: 'descricao', header: 'O que faz', render: (i) => <span className="block min-w-64 max-w-lg whitespace-normal">{i.descricao}</span> },
  ],
  campos: [
    { chave: 'nome', rotulo: 'Parâmetro', tipo: 'texto', fixoAoEditar: true },
    { chave: 'valor', rotulo: 'Valor', tipo: 'texto', obrigatorio: true, maximo: 60 },
    { chave: 'descricao', rotulo: 'O que faz', tipo: 'textoLongo', fixoAoEditar: true },
  ],
  novo: () => ({ nome: '', valor: '', descricao: '' }),
  nomeDe: (i) => i.nome,
  textoDeBusca: (i) => `${i.nome} ${i.descricao}`,
};
