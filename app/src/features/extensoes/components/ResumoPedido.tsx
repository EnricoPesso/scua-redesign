import { contarDias, formatarDuracao, minutosPorDia } from '../domain/horas';
import { mesDe } from '../domain/formatacao';
import { avaliarLimite } from '../domain/limite';
import type { Horario } from '../domain/types';
import { useResumo } from '../hooks/queries';
import { BarraLimite } from './BarraLimite';

interface Props {
  dataInicial: string;
  dataFinal: string;
  horario: Horario;
  /** Quem vai fazer a extensão; vazio enquanto não escolheu. */
  beneficiarioId: string;
  hoje: string;
}

/** Total de horas, uso do limite do mês e quem aprova. As duas últimas linhas somem se a API não tiver o dado. */
export function ResumoPedido({ dataInicial, dataFinal, horario, beneficiarioId, hoje }: Props) {
  const dias = contarDias(dataInicial, dataFinal);
  const porDia = minutosPorDia(horario);
  const total = dias * porDia;
  const mes = mesDe(dias > 0 ? dataInicial : hoje);
  const resumo = useResumo(beneficiarioId || undefined, mes);
  const dados = resumo.data ?? null;

  return (
    <section aria-labelledby="titulo-resumo" className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
      <h3 id="titulo-resumo" className="text-sm font-bold text-foreground">Resumo</h3>
      <p aria-live="polite" className="text-sm text-foreground">
        {total > 0
          ? `${dias} ${dias === 1 ? 'dia' : 'dias'} × ${formatarDuracao(porDia)} = ${formatarDuracao(total)} de extensão`
          : 'Preencha os dias e o horário para ver o total.'}
      </p>
      {dados && <BarraLimite avaliacao={avaliarLimite(dados.minutosAprovadosNoMes, total, dados.limiteMensalMin)} limiteMin={dados.limiteMensalMin} />}
      {dados?.aprovador && <p className="text-sm text-foreground">Quem aprova: <strong>{dados.aprovador.nome}</strong></p>}
    </section>
  );
}
