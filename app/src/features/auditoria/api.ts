import { quando } from '../../mock/datas';
import { PESSOAS_DIRETORIO } from '../../mock/diretorio';
import { rede } from '../../mock/rede';
import { filtrarRegistros, type Aba, type Acao, type FiltroRegistros, type Registro } from './domain/auditoria';

/** Ainda não existe contrato de API: registros em memória, determinísticos e relativos a hoje. Quando a API existir, só este arquivo muda. */

/** Item e par de valores (antes, depois) de cada tipo de alteração, por aba. */
const MODELOS: Record<Aba, { item: string; antes: string; depois: string }[]> = {
  parametros: [
    { item: 'Tolerância de atraso na entrada', antes: '5 min', depois: '10 min' },
    { item: 'Tempo de inatividade da estação', antes: '10 min', depois: '15 min' },
    { item: 'Intervalo mínimo de almoço', antes: '1h', depois: '1h30' },
    { item: 'Limite diário de jornada', antes: '8h', depois: '10h' },
    { item: 'Dia de fechamento da folha', antes: '25', depois: '28' },
    { item: 'Aviso de pausa', antes: '2h', depois: '3h' },
  ],
  jornadas: [
    { item: 'Jornada comercial', antes: '08:00 às 17:00', depois: '09:00 às 18:00' },
    { item: 'Turno da tarde', antes: '13:00 às 21:00', depois: '12:00 às 20:00' },
    { item: 'Jornada administrativa', antes: '44h semanais', depois: '40h semanais' },
    { item: 'Plantão de fim de semana', antes: 'Sábado', depois: 'Sábado e domingo' },
    { item: 'Jornada 6x1', antes: 'Folga no domingo', depois: 'Folga na segunda' },
  ],
  excecoes: [
    { item: 'Exceção de Ana Souza', antes: 'Sem exceção', depois: 'Consulta médica' },
    { item: 'Exceção de João Lima', antes: 'Sem exceção', depois: 'Curso externo' },
    { item: 'Exceção de Bia Rocha', antes: 'Home office', depois: 'Presencial' },
    { item: 'Exceção da diretoria Financeiro', antes: 'Sem exceção', depois: 'Fechamento do mês' },
    { item: 'Exceção de Rui Alves', antes: 'Abonado', depois: 'Não abonado' },
  ],
  liberacoes: [
    { item: 'Liberação da diretoria Comercial', antes: 'Bloqueada', depois: 'Liberada' },
    { item: 'Liberação da estação SCUA-NB-014', antes: 'Bloqueada', depois: 'Liberada' },
    { item: 'Liberação da diretoria Operações', antes: 'Liberada', depois: 'Bloqueada' },
    { item: 'Liberação do uso fora do horário', antes: 'Não', depois: 'Sim' },
    { item: 'Liberação da estação SCUA-DT-019', antes: 'Bloqueada', depois: 'Liberada' },
  ],
  whatsapp: [
    { item: 'Modelo de aviso de pausa', antes: 'Olá, está na hora da sua pausa.', depois: 'Olá, que tal fazer uma pausa agora?' },
    { item: 'Modelo de lembrete de justificativa', antes: 'Falta justificar o dia.', depois: 'Você tem um dia sem justificativa.' },
    { item: 'Número de envio das mensagens', antes: '(11) 4000-1000', depois: '(11) 4000-2000' },
    { item: 'Horário de envio dos avisos', antes: '08:00', depois: '09:00' },
    { item: 'Aviso de extensão de jornada', antes: 'Desligado', depois: 'Ligado' },
  ],
};

const ABAS: Aba[] = ['parametros', 'jornadas', 'excecoes', 'liberacoes', 'whatsapp'];
const POR_ABA = 25;
const ACOES: Acao[] = ['Alterou', 'Alterou', 'Criou', 'Alterou', 'Excluiu'];

/** ~25 registros por aba, espalhados pelos últimos ~30 dias, sempre os mesmos. */
function gerar(aba: Aba): Registro[] {
  const modelos = MODELOS[aba];
  const base = ABAS.indexOf(aba);
  return Array.from({ length: POR_ABA }, (_, k): Registro => {
    const m = modelos[(k + base) % modelos.length];
    const acao = ACOES[(k * 3 + base) % ACOES.length];
    const deslocamento = -Math.floor(k * 1.3);
    // Hoje só registros da manhã (o relógio dos exemplos é 10:00).
    const hora = deslocamento === 0 ? 8 + (k % 2) : 8 + ((k * 7 + base) % 10);
    const minuto = (k * 11 + base * 7) % 60;
    return {
      id: `${aba}-${k + 1}`,
      aba,
      item: m.item,
      acao,
      anterior: acao === 'Criou' ? null : m.antes,
      novo: acao === 'Excluiu' ? null : m.depois,
      pessoaId: PESSOAS_DIRETORIO[(k * 5 + base * 3) % PESSOAS_DIRETORIO.length].id,
      quando: quando(deslocamento, `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`),
    };
  });
}

export const auditoriaApi = {
  listar(aba: Aba, filtro: FiltroRegistros): Promise<Registro[]> {
    return rede(() => filtrarRegistros(gerar(aba), filtro));
  },
};

