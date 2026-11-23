import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button-variants';
import { Drawer } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { emHoras, emReais } from '../../../lib/conformidade';
import type { LinhaPrevisao } from '../api';
import { REGRA_DO_RISCO, ROTULO_NIVEL, rotuloDoDia, type TipoRisco } from '../domain/previsao';
import { STATUS_BADGE } from './FaixaDeDias';

const TITULO = 'text-xs font-bold tracking-wide text-muted-foreground uppercase';
const ACAO = cn(buttonVariants({ variant: 'secondary' }), 'w-full justify-start max-md:h-11');

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h3 id={id} className={TITULO}>{titulo}</h3>
      {children}
    </section>
  );
}

/** Ações que atacam os riscos da pessoa. O dossiê e o cadastro valem sempre. */
function acoesSugeridas(linha: LinhaPrevisao): { para: string; rotulo: string; dica: string }[] {
  const tipos = new Set<TipoRisco>(linha.riscos.map((r) => r.tipo));
  const acoes: { para: string; rotulo: string; dica: string }[] = [];
  if (tipos.has('extraDiaria') || tipos.has('limiteMensal')) {
    acoes.push({ para: '/extensoes', rotulo: 'Revisar as extensões', dica: 'Ver os pedidos e decidir antes de a hora extra acontecer.' });
  }
  if (tipos.has('interjornada') || tipos.has('intervalo') || tipos.has('extraDiaria')) {
    acoes.push({ para: '/jornadas', rotulo: 'Ajustar a jornada', dica: 'Mudar horário de entrada, saída ou intervalo.' });
  }
  acoes.push({ para: '/usuarios', rotulo: 'Ver o cadastro da pessoa', dica: 'Conferir grupo, gestor e estação.' });
  acoes.push({ para: `/dossie?pessoa=${linha.pessoaId}`, rotulo: 'Abrir o dossiê', dica: 'Ver o histórico de jornada e as ocorrências.' });
  return acoes;
}

/** Painel lateral: por que a pessoa está em risco, dia a dia, e o que fazer. O estado ("?pessoa=") fica na URL. */
export function PainelPessoa({ linha, aoFechar }: { linha: LinhaPrevisao; aoFechar: () => void }) {
  const diasComRisco = linha.dias.filter((d) => d.riscos.length > 0);
  const descricao = [linha.diretoria, linha.gestorNome ? `gestor: ${linha.gestorNome}` : null, linha.grupoNome ? `grupo ${linha.grupoNome}` : null].filter(Boolean).join(' · ');
  return (
    <Drawer open onOpenChange={(a) => { if (!a) aoFechar(); }} title={linha.nome} description={descricao}>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            {linha.nivel ? <Badge status={STATUS_BADGE[linha.nivel]}>Risco {ROTULO_NIVEL[linha.nivel].toLowerCase()}</Badge> : <Badge>Sem risco previsto</Badge>}
            <span>{emHoras(linha.extraSemanaMin)} de hora extra prevista · {emReais(linha.custoSemana)}</span>
          </p>
          <p className="text-sm text-foreground">{linha.motivoPrincipal}</p>
        </div>

        <Secao titulo="Riscos por dia">
          {diasComRisco.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum risco previsto nos próximos 7 dias.</p>
          ) : (
            <ul className="grid gap-4">
              {diasComRisco.map((d) => (
                <li key={d.dia} className="grid gap-2">
                  <p className="text-sm font-bold text-foreground">{rotuloDoDia(d.dia)}</p>
                  <ul className="grid gap-2">
                    {d.riscos.map((r) => (
                      <li key={r.tipo} className="grid gap-1 rounded-md border border-[var(--color-line)] bg-card p-3">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                          <Badge status={STATUS_BADGE[r.nivel]}>{ROTULO_NIVEL[r.nivel]}</Badge>
                          {REGRA_DO_RISCO[r.tipo].titulo}
                        </p>
                        <p className="text-xs text-muted-foreground">{REGRA_DO_RISCO[r.tipo].base}</p>
                        <p className="text-sm text-foreground">{r.motivo}</p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Previsão por dia">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Hora extra, entrada e saída prováveis nos próximos 7 dias</caption>
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="py-1 pr-3 font-semibold">Dia</th>
                  <th scope="col" className="py-1 pr-3 font-semibold">Hora extra</th>
                  <th scope="col" className="py-1 pr-3 font-semibold">Entrada</th>
                  <th scope="col" className="py-1 font-semibold">Saída</th>
                </tr>
              </thead>
              <tbody>
                {linha.dias.map((d) => (
                  <tr key={d.dia} className="border-t border-[var(--color-line)] text-foreground">
                    <th scope="row" className="py-1.5 pr-3 font-semibold whitespace-nowrap">{rotuloDoDia(d.dia)}</th>
                    {d.util ? (
                      <>
                        <td className="py-1.5 pr-3 tabular-nums">{d.extraMin > 0 ? emHoras(d.extraMin) : 'Nenhuma'}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{d.entrada ?? '—'}</td>
                        <td className="py-1.5 tabular-nums">{d.saida ?? '—'}</td>
                      </>
                    ) : (
                      <td colSpan={3} className="py-1.5 text-muted-foreground">Sem jornada</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>

        <Secao titulo="O que fazer">
          <ul className="grid gap-2">
            {acoesSugeridas(linha).map((a) => (
              <li key={a.para} className="grid gap-0.5">
                <Link to={a.para} className={ACAO}>{a.rotulo}</Link>
                <p className="text-xs text-muted-foreground">{a.dica}</p>
              </li>
            ))}
          </ul>
        </Secao>
      </div>
    </Drawer>
  );
}
