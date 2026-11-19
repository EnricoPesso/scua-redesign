import { useId, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Drawer } from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { ehAba } from '../domain/abas';
import { descreverEvento, eventosRecentesPrimeiro, MOTIVOS, proximoDaFila, rotuloMotivo, validarReprovacao, type ErrosReprovacao } from '../domain/decisao';
import { ApiError, mensagemJaDecidido, mensagemParaUsuario } from '../domain/erros';
import { formatarPeriodo, mesDe, tempoDesde } from '../domain/formatacao';
import { contarDias, formatarDuracao, minutosPorDia } from '../domain/horas';
import { avaliarLimite } from '../domain/limite';
import type { Decisao, MotivoReprovacao, Pagina, Pedido, Permissoes } from '../domain/types';
import { useCancelarPedido, useDecidir } from '../hooks/mutations';
import { chaves, useListaPedidos, usePedido, usePermissoes, useResumo } from '../hooks/queries';
import { BarraLimite } from './BarraLimite';
import { GrupoRadio } from './GrupoRadio';
import { Carregando, PainelMensagem } from './PainelPedido';
import { SeloStatus } from './SeloStatus';
import { useAvisar } from './useAvisar';
import { useFecharPainel } from './useFecharPainel';
import { useFocarAviso } from './useFocarAviso';
import { useFiltros } from './useFiltros';

// No celular os botões do rodapé dividem a largura e têm 44px de altura (spec, seção 7.4).
const BOTAO_RODAPE = 'max-md:h-11 max-md:flex-1';
/** Depois de avançar sozinho na fila, o segundo clique de um duplo clique não pode decidir o pedido seguinte. */
const PAUSA_APOS_AVANCAR_MS = 600;
const TITULO_SECAO = 'text-xs font-bold tracking-wide text-muted-foreground uppercase';
const primeiroNome = (nome: string) => nome.split(' ')[0];

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-1.5">
      <h3 id={id} className={TITULO_SECAO}>{titulo}</h3>
      {children}
    </section>
  );
}

/** Texto do conflito quando o pedido já não está pendente (decidido em outro canal ou cancelado). */
function textoConflito(p: Pedido): string | null {
  if (p.status === 'pendente') return null;
  if (p.decisao) return mensagemJaDecidido({ status: p.decisao.status, por: p.decisao.por.nome, canal: p.decisao.canal, em: p.decisao.em });
  return 'Este pedido não está mais pendente.';
}

/** Painel de detalhe: `/extensoes/:aba/:id`. Carrega o pedido e trata acesso negado, inexistente e falha. */
export function DetalhePedido() {
  const { aba = 'meus', id = '' } = useParams();
  const { fechar } = useFecharPainel(aba, id);
  const permissoes = usePermissoes();
  const alvo = usePedido(id);

  if (alvo.isError || permissoes.isError) {
    const erro = alvo.error ?? permissoes.error;
    const status = erro instanceof ApiError ? erro.status : 0;
    const texto = <p role="alert" className="text-sm text-foreground">{mensagemParaUsuario(erro, 'carregar')}</p>;
    if (status === 403) {
      return (
        <Drawer open onOpenChange={(a) => { if (!a) fechar(); }} title="Pedido" footer={<Link to="/extensoes/meus" className={cn(buttonVariants(), BOTAO_RODAPE)}>Voltar para minhas extensões</Link>}>
          {texto}
        </Drawer>
      );
    }
    if (status === 404) {
      return <Drawer open onOpenChange={(a) => { if (!a) fechar(); }} title="Pedido" footer={<Button className={BOTAO_RODAPE} onClick={fechar}>Voltar</Button>}>{texto}</Drawer>;
    }
    return <PainelMensagem titulo="Pedido" aoFechar={fechar} aoTentar={() => { void alvo.refetch(); void permissoes.refetch(); }}>{texto}</PainelMensagem>;
  }
  if (alvo.isPending || permissoes.isPending) {
    return <PainelMensagem titulo="Pedido" aoFechar={fechar}><Carregando rotulo="Carregando pedido" /></PainelMensagem>;
  }
  return <ConteudoPedido key={id} pedido={alvo.data} perm={permissoes.data} aba={ehAba(aba) ? aba : 'meus'} aoFechar={fechar} />;
}

function ConteudoPedido({ pedido, perm, aba, aoFechar }: { pedido: Pedido; perm: Permissoes; aba: 'aprovar' | 'meus' | 'todos'; aoFechar: () => void }) {
  const navigate = useNavigate();
  const { search, state } = useLocation();
  const client = useQueryClient();
  const veioDaFila = (state as { daFila?: boolean } | null)?.daFila === true;
  const [abertoEm] = useState(() => performance.now());
  const avisar = useAvisar();
  const { filtros } = useFiltros(aba);
  const decidir = useDecidir();
  const cancelar = useCancelarPedido();
  const enviando = useRef(false);

  const [passo, setPasso] = useState<'detalhe' | 'reprovar'>('detalhe');
  const [comentario, setComentario] = useState('');
  const [erroAcao, setErroAcao] = useState<{ texto: string; tentar?: () => void } | null>(null);
  const [conflito, setConflito] = useState<string | null>(null);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const refErro = useFocarAviso<HTMLDivElement>(erroAcao);
  const refConflito = useFocarAviso<HTMLParagraphElement>(conflito);

  const nome = pedido.beneficiario.nome;
  const pendente = pedido.status === 'pendente';
  const podeDecidir = aba === 'aprovar' && perm.podeAprovar && pedido.gestor?.id === perm.usuario.id;
  const textoDoConflito = conflito ?? (aba === 'aprovar' ? textoConflito(pedido) : null);
  const mostrarDecisao = podeDecidir && pendente && !textoDoConflito;
  const podeAlterar = aba === 'meus' && pendente && pedido.solicitante.id === perm.usuario.id;

  /** Pedidos pendentes da página atual da fila, na ordem em que aparecem. */
  const filaAtual = () => {
    const pagina = client.getQueryData<Pagina<Pedido>>(chaves.lista(filtros));
    return (pagina?.itens ?? []).filter((p) => p.status === 'pendente').map((p) => p.id);
  };

  const enviarDecisao = (decisao: Decisao) => {
    if (enviando.current) return;
    if (veioDaFila && performance.now() - abertoEm < PAUSA_APOS_AVANCAR_MS) return;
    enviando.current = true;
    setErroAcao(null);
    const fila = filaAtual();
    decidir.mutate({ id: pedido.id, decisao }, {
      onSuccess: () => {
        avisar(`Pedido ${decisao.acao === 'aprovar' ? 'aprovado' : 'reprovado'}. ${nome} vai receber o aviso.`);
        const proximo = proximoDaFila(fila, pedido.id);
        if (proximo) void navigate({ pathname: `/extensoes/aprovar/${proximo}`, search }, { state: { daFila: true } });
        else aoFechar();
      },
      onError: (erro) => {
        // Só o erro libera um novo envio: depois do sucesso este pedido já foi decidido.
        enviando.current = false;
        console.error(erro);
        setPasso('detalhe');
        if (erro instanceof ApiError && erro.status === 409) setConflito(mensagemParaUsuario(erro, 'decidir'));
        else setErroAcao({ texto: mensagemParaUsuario(erro, 'decidir'), tentar: () => enviarDecisao(decisao) });
      },
    });
  };

  const aprovar = () => enviarDecisao(comentario.trim() ? { acao: 'aprovar', comentario: comentario.trim() } : { acao: 'aprovar' });

  const confirmarCancelar = () => {
    cancelar.mutate(pedido.id, {
      onSuccess: () => {
        setConfirmarCancelamento(false);
        avisar(`Pedido cancelado. ${pedido.gestor ? pedido.gestor.nome : 'Quem aprova'} vai receber o aviso.`);
        aoFechar();
      },
      onError: (erro) => {
        console.error(erro);
        setConfirmarCancelamento(false);
        setErroAcao({ texto: erro instanceof ApiError && erro.status === 409 ? mensagemParaUsuario(erro, 'enviar') : 'Não conseguimos cancelar o pedido. Tente de novo.' });
      },
    });
  };

  if (passo === 'reprovar') {
    return <PassoReprovar nome={nome} enviando={decidir.isPending} aoVoltar={() => setPasso('detalhe')} aoConfirmar={(motivo, mensagem) => enviarDecisao({ acao: 'reprovar', motivo, ...(mensagem ? { mensagem } : {}) })} />;
  }

  const periodo = formatarPeriodo(pedido.dataInicial, pedido.dataFinal, pedido.horario);
  let rodape: ReactNode = null;
  if (podeDecidir && (pendente || textoDoConflito)) {
    // Com conflito os botões ficam desativados (critério 7); o aviso no topo explica o motivo.
    const bloqueado = !mostrarDecisao;
    rodape = (
      <>
        {!bloqueado && <Field
          className="w-full"
          label="Comentário (opcional)"
          inputProps={{ value: comentario, maxLength: 500, onValueChange: (v: string) => setComentario(v), render: <textarea rows={2} />, className: 'h-auto py-2' }}
        />}
        <Button variant="secondary" className={BOTAO_RODAPE} disabled={bloqueado || decidir.isPending} onClick={() => setPasso('reprovar')}>Reprovar</Button>
        <Button className={cn(BOTAO_RODAPE, 'md:min-w-32')} disabled={bloqueado} loading={decidir.isPending} onClick={aprovar}>Aprovar</Button>
      </>
    );
  } else if (podeAlterar) {
    rodape = (
      <>
        <Button variant="secondary" className={BOTAO_RODAPE} onClick={() => setConfirmarCancelamento(true)}>Cancelar pedido</Button>
        <Link to={{ pathname: `/extensoes/meus/${pedido.id}/editar`, search }} className={cn(buttonVariants(), BOTAO_RODAPE)}>Editar</Link>
      </>
    );
  }

  return (
    <>
      <Drawer open onOpenChange={(a) => { if (!a) aoFechar(); }} title={`Pedido de ${nome}`} footer={rodape}>
        <div className="grid gap-6">
          <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            <SeloStatus status={pedido.status} />
            <span>pedido {tempoDesde(pedido.criadoEm)}</span>
          </p>

          {textoDoConflito && (
            <p ref={refConflito} tabIndex={-1} role="status" className="rounded-md bg-[var(--color-warning-bg)] outline-none focus-visible:ring-3 focus-visible:ring-ring p-3 text-sm font-semibold text-[var(--color-warning-text)]">{textoDoConflito}</p>
          )}
          {erroAcao && (
            <div ref={refErro} tabIndex={-1} role="alert" className="grid gap-2 rounded-md bg-[var(--color-danger-bg)] p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring text-sm text-[var(--color-danger-text)]">
              <p className="font-semibold">{erroAcao.texto}</p>
              {erroAcao.tentar && <Button variant="secondary" className="w-fit max-md:h-11" onClick={erroAcao.tentar}>Tentar de novo</Button>}
            </div>
          )}

          {pedido.status === 'reprovado' && pedido.decisao?.motivo && (
            <MotivoReprovado pedido={pedido} podePedirDeNovo={aba === 'meus' && perm.podePedir} />
          )}

          <Secao titulo="Quando">
            <p className="text-sm font-semibold text-foreground">{periodo}</p>
            <p className="text-sm text-foreground">{textoTotal(pedido)}</p>
          </Secao>

          <Secao titulo="Por quê">
            <p className="text-sm text-foreground">{pedido.justificativa.descricao}</p>
            {pedido.detalhes && <p className="text-sm text-foreground italic">“{pedido.detalhes}”</p>}
          </Secao>

          <UsoDoMes pedido={pedido} />

          <Secao titulo="Pedido por">
            <p className="text-sm text-foreground">{textoSolicitante(pedido, perm)}</p>
          </Secao>

          {aba === 'aprovar' && <OutrosPendentes pedido={pedido} />}

          {pedido.historico && pedido.historico.length > 0 && <Historico pedido={pedido} usuarioId={perm.usuario.id} />}
        </div>
      </Drawer>
      <ConfirmDialog
        open={confirmarCancelamento}
        onOpenChange={setConfirmarCancelamento}
        title={`Cancelar o pedido de ${periodo}?`}
        description={`${pedido.gestor ? pedido.gestor.nome : 'Quem aprova'} vai receber o aviso.`}
        confirmLabel="Cancelar pedido"
        cancelLabel="Voltar"
        destructive
        loading={cancelar.isPending}
        onConfirm={confirmarCancelar}
      />
    </>
  );
}

function textoTotal(p: Pedido): string {
  const dias = contarDias(p.dataInicial, p.dataFinal);
  const porDia = minutosPorDia(p.horario);
  return `${dias} ${dias === 1 ? 'dia' : 'dias'} × ${formatarDuracao(porDia)} = ${formatarDuracao(dias * porDia)}`;
}

function textoSolicitante(p: Pedido, perm: Permissoes): string {
  if (p.solicitante.id === p.beneficiario.id) return `${p.solicitante.nome} (a própria pessoa)`;
  if (p.solicitante.id === perm.usuario.id) return 'Você';
  return p.solicitante.nome;
}

/** Uso do mês do beneficiário, com o impacto deste pedido se ainda estiver pendente. Some se a API não tiver o dado. */
function UsoDoMes({ pedido }: { pedido: Pedido }) {
  const resumo = useResumo(pedido.beneficiario.id, mesDe(pedido.dataInicial));
  if (!resumo.data) return null;
  const dias = contarDias(pedido.dataInicial, pedido.dataFinal);
  const esteMin = pedido.status === 'pendente' ? dias * minutosPorDia(pedido.horario) : 0;
  const { minutosAprovadosNoMes, limiteMensalMin } = resumo.data;
  return (
    <Secao titulo={`${primeiroNome(pedido.beneficiario.nome)} neste mês`}>
      <p className="text-sm text-foreground">{formatarDuracao(minutosAprovadosNoMes)} já aprovadas{esteMin > 0 ? `, com este pedido ${formatarDuracao(minutosAprovadosNoMes + esteMin)}` : ''}</p>
      <BarraLimite avaliacao={avaliarLimite(minutosAprovadosNoMes, esteMin, limiteMensalMin)} limiteMin={limiteMensalMin} />
    </Secao>
  );
}

function OutrosPendentes({ pedido }: { pedido: Pedido }) {
  const { search } = useLocation();
  const lista = useListaPedidos({ aba: 'aprovar', de: '', ate: '', pessoa: pedido.beneficiario.nome, pagina: 1, tamanho: 10 });
  const outros = (lista.data?.itens ?? []).filter((p) => p.id !== pedido.id && p.beneficiario.id === pedido.beneficiario.id);
  if (outros.length === 0) return null;
  const id = `outros-${pedido.id}`;
  return (
    <section aria-labelledby={id} className="grid gap-1.5">
      <h3 id={id} className={TITULO_SECAO}>Outros pedidos pendentes</h3>
      <ul aria-labelledby={id} className="grid gap-1">
        {outros.map((p) => (
          <li key={p.id}>
            <Link to={{ pathname: `/extensoes/aprovar/${p.id}`, search }} className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-[var(--color-brand-text)] underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring md:min-h-0">
              {formatarPeriodo(p.dataInicial, p.dataFinal, p.horario)} · {formatarDuracao(contarDias(p.dataInicial, p.dataFinal) * minutosPorDia(p.horario))}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MotivoReprovado({ pedido, podePedirDeNovo }: { pedido: Pedido; podePedirDeNovo: boolean }) {
  const d = pedido.decisao!;
  const id = `motivo-${pedido.id}`;
  return (
    <section aria-labelledby={id} className="grid gap-2 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-danger-bg)] p-4">
      <h3 id={id} className="text-sm font-bold text-[var(--color-danger-text)]">Motivo da reprovação</h3>
      <p className="text-sm font-semibold text-foreground">{rotuloMotivo(d.motivo!)}</p>
      {d.mensagem && <p className="text-sm text-foreground">“{d.mensagem}” — {d.por.nome}</p>}
      {podePedirDeNovo && (
        <Link to={`/extensoes/meus/novo?base=${pedido.id}`} className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit max-md:h-11')}>Pedir de novo com outra data</Link>
      )}
    </section>
  );
}

const ICONE: Record<string, string> = { criado: '+', editado: '✎', avisado: '✉', aprovado: '✓', reprovado: '✕', cancelado: '–' };

function Historico({ pedido, usuarioId }: { pedido: Pedido; usuarioId: string }) {
  const id = `historico-${pedido.id}`;
  return (
    <section className="grid gap-2">
      <h3 id={id} className={TITULO_SECAO}>Histórico</h3>
      <ol aria-labelledby={id} className="grid gap-3 border-l-2 border-[var(--color-line)] pl-4">
        {eventosRecentesPrimeiro(pedido.historico ?? []).map((e, i) => {
          const { titulo, detalhe } = descreverEvento(e, usuarioId);
          return (
            <li key={`${e.tipo}-${e.em}-${i}`} className="relative text-sm">
              <span aria-hidden className="absolute top-0 -left-[1.6rem] grid size-5 place-items-center rounded-full bg-[var(--color-surface-muted)] text-xs text-foreground">{ICONE[e.tipo]}</span>
              <p className="font-semibold text-foreground">{titulo}</p>
              <p className="text-muted-foreground">{detalhe}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PassoReprovar({ nome, enviando, aoVoltar, aoConfirmar }: {
  nome: string;
  enviando: boolean;
  aoVoltar: () => void;
  aoConfirmar: (motivo: MotivoReprovacao, mensagem: string) => void;
}) {
  const [motivo, setMotivo] = useState<MotivoReprovacao | ''>('');
  const [mensagem, setMensagem] = useState('');
  const [erros, setErros] = useState<ErrosReprovacao>({});
  const area = useRef<HTMLDivElement>(null);
  const idErroMotivo = useId();
  const obrigatoria = motivo === 'outro';

  const confirmar = () => {
    const e = validarReprovacao(motivo || null, mensagem);
    setErros(e);
    if (e.motivo) { area.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus(); return; }
    if (e.mensagem) { area.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus(); return; }
    aoConfirmar(motivo as MotivoReprovacao, mensagem.trim());
  };

  return (
    <Drawer
      open
      onOpenChange={(a) => { if (!a) aoVoltar(); }}
      title={`Reprovar pedido de ${nome}`}
      footer={
        <>
          <Button variant="secondary" className={BOTAO_RODAPE} disabled={enviando} onClick={aoVoltar}>Voltar</Button>
          <Button variant="destructive" className={BOTAO_RODAPE} loading={enviando} onClick={confirmar}>Confirmar reprovação</Button>
        </>
      }
    >
      <div ref={area} className="grid gap-5">
        <div className="grid gap-1" aria-describedby={erros.motivo ? idErroMotivo : undefined}>
          <GrupoRadio
            legenda="Motivo *"
            className="[&_div]:grid [&_div]:gap-0"
            opcoes={MOTIVOS}
            valor={motivo}
            aoMudar={(v) => { setMotivo(v); setErros((x) => ({ ...x, motivo: undefined })); }}
          />
          {erros.motivo && <p id={idErroMotivo} className="text-sm font-semibold text-[var(--color-danger-text)]">{erros.motivo}</p>}
        </div>
        <Field
          label={`Mensagem para ${primeiroNome(nome)} (${obrigatoria ? 'obrigatório' : 'opcional'})`}
          error={erros.mensagem}
          inputProps={{ value: mensagem, maxLength: 500, onValueChange: (v: string) => { setMensagem(v); setErros((x) => ({ ...x, mensagem: undefined })); }, render: <textarea rows={4} />, className: 'h-auto py-2' }}
        />
      </div>
    </Drawer>
  );
}
