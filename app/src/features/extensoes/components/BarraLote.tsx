import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { MOTIVOS, validarReprovacao, type ErrosReprovacao } from '../domain/decisao';
import { mensagemParaUsuario } from '../domain/erros';
import { formatarPeriodo } from '../domain/formatacao';
import { formatarDuracao, totalMinutos } from '../domain/horas';
import type { Decisao, MotivoReprovacao, Pedido, ResultadoLote } from '../domain/types';
import { useDecidirEmLote } from '../hooks/mutations';
import { DialogoLocal } from './DialogoLocal';
import { GrupoRadio } from './GrupoRadio';
import { useAvisar } from './useAvisar';

const BOTAO = 'max-md:h-11 max-md:flex-1';
const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);
const horasDe = (p: Pedido) => totalMinutos(p.dataInicial, p.dataFinal, p.horario);

type Acao = 'aprovar' | 'reprovar';
type Etapa = { tipo: 'confirmar'; acao: Acao } | { tipo: 'resultado'; acao: Acao; resultado: ResultadoLote } | null;

/** Texto do sucesso total: "2 pedidos aprovados. As pessoas vão receber o aviso." */
export function textoLoteOk(n: number, acao: Acao): string {
  const feito = acao === 'aprovar' ? plural(n, 'aprovado', 'aprovados') : plural(n, 'reprovado', 'reprovados');
  return `${n} ${plural(n, 'pedido', 'pedidos')} ${feito}. ${plural(n, 'A pessoa vai', 'As pessoas vão')} receber o aviso.`;
}

// pedir ao @PhLima07: barra de ações em lote (o sistema de design ainda não tem).
export function BarraLote({ pedidos, aoConcluir }: { pedidos: Pedido[]; aoConcluir: () => void }) {
  const avisar = useAvisar();
  const lote = useDecidirEmLote();
  const enviando = useRef(false);
  const [etapa, setEtapa] = useState<Etapa>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<MotivoReprovacao | ''>('');
  const [mensagem, setMensagem] = useState('');
  const [erros, setErros] = useState<ErrosReprovacao>({});

  const n = pedidos.length;
  const total = pedidos.reduce((s, p) => s + horasDe(p), 0);

  const abrir = (acao: Acao) => {
    setErro(null);
    setErros({});
    setMotivo('');
    setMensagem('');
    setEtapa({ tipo: 'confirmar', acao });
  };
  const fechar = () => { if (!lote.isPending) setEtapa(null); };

  const enviar = (acao: Acao) => {
    if (enviando.current) return;
    let decisao: Decisao = { acao: 'aprovar' };
    if (acao === 'reprovar') {
      const e = validarReprovacao(motivo || null, mensagem);
      setErros(e);
      if (e.motivo || e.mensagem) return;
      decisao = { acao: 'reprovar', motivo: motivo as MotivoReprovacao, ...(mensagem.trim() ? { mensagem: mensagem.trim() } : {}) };
    }
    enviando.current = true;
    setErro(null);
    lote.mutate({ ids: pedidos.map((p) => p.id), decisao }, {
      onSuccess: (resultado) => {
        if (resultado.falhas.length === 0) {
          avisar(textoLoteOk(resultado.sucesso.length, acao));
          setEtapa(null);
        } else {
          setEtapa({ tipo: 'resultado', acao, resultado });
        }
        aoConcluir();
      },
      onError: (e) => {
        console.error(e);
        setErro(mensagemParaUsuario(e, 'decidir'));
      },
      onSettled: () => { enviando.current = false; },
    });
  };

  const lista = (
    <ul className="grid list-disc gap-1 pl-5">
      {pedidos.map((p) => (
        <li key={p.id}>{`${p.beneficiario.nome} — ${formatarDuracao(horasDe(p))} (${formatarPeriodo(p.dataInicial, p.dataFinal, p.horario)})`}</li>
      ))}
    </ul>
  );
  const alerta = erro && <p role="alert" className="rounded-md bg-[var(--color-danger-bg)] p-3 font-semibold text-[var(--color-danger-text)]">{erro}</p>;

  return (
    <>
      {n > 0 && (
        <section
          aria-label="Ações em lote"
          className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-3)]"
        >
          <p className="text-sm font-semibold text-foreground" aria-live="polite">
            {`${n} ${plural(n, 'selecionado', 'selecionados')} · ${formatarDuracao(total)} no total`}
          </p>
          <div className="flex gap-2 max-md:w-full">
            <Button variant="secondary" className={BOTAO} onClick={() => abrir('reprovar')}>Reprovar</Button>
            <Button className={BOTAO} onClick={() => abrir('aprovar')}>Aprovar</Button>
          </div>
        </section>
      )}

      <DialogoLocal
        aberto={etapa?.tipo === 'confirmar' && etapa.acao === 'aprovar'}
        titulo={`Aprovar ${n} ${plural(n, 'pedido', 'pedidos')}?`}
        aoFechar={fechar}
        rodape={
          <>
            <Button variant="secondary" className={BOTAO} disabled={lote.isPending} onClick={fechar}>Cancelar</Button>
            <Button className={BOTAO} loading={lote.isPending} onClick={() => enviar('aprovar')}>{`Aprovar ${n}`}</Button>
          </>
        }
      >
        {lista}
        <p className="font-semibold">Total: {formatarDuracao(total)}</p>
        <p className="text-muted-foreground">As pessoas vão receber o aviso e os computadores serão liberados nesses horários.</p>
        {alerta}
      </DialogoLocal>

      <DialogoLocal
        aberto={etapa?.tipo === 'confirmar' && etapa.acao === 'reprovar'}
        titulo={`Reprovar ${n} ${plural(n, 'pedido', 'pedidos')}?`}
        aoFechar={fechar}
        rodape={
          <>
            <Button variant="secondary" className={BOTAO} disabled={lote.isPending} onClick={fechar}>Cancelar</Button>
            <Button variant="destructive" className={BOTAO} loading={lote.isPending} onClick={() => enviar('reprovar')}>{`Reprovar ${n}`}</Button>
          </>
        }
      >
        {lista}
        <div className="grid gap-1">
          <GrupoRadio legenda="Motivo (vale para todos) *" className="[&_div]:grid [&_div]:gap-0" opcoes={MOTIVOS} valor={motivo}
            aoMudar={(v) => { setMotivo(v); setErros((x) => ({ ...x, motivo: undefined })); }} />
          {erros.motivo && <p className="font-semibold text-[var(--color-danger-text)]">{erros.motivo}</p>}
        </div>
        <Field
          label={`Mensagem (${motivo === 'outro' ? 'obrigatório' : 'opcional'})`}
          error={erros.mensagem}
          inputProps={{ value: mensagem, maxLength: 500, onValueChange: (v: string) => { setMensagem(v); setErros((x) => ({ ...x, mensagem: undefined })); }, render: <textarea rows={3} />, className: 'h-auto py-2' }}
        />
        {alerta}
      </DialogoLocal>

      <DialogoLocal
        aberto={etapa?.tipo === 'resultado'}
        titulo={etapa?.acao === 'reprovar' ? 'Resultado da reprovação' : 'Resultado da aprovação'}
        aoFechar={() => setEtapa(null)}
        rodape={<Button className={BOTAO} onClick={() => setEtapa(null)}>Ok</Button>}
      >
        {etapa?.tipo === 'resultado' && <Resultado acao={etapa.acao} resultado={etapa.resultado} />}
      </DialogoLocal>
    </>
  );
}

function Resultado({ acao, resultado }: { acao: Acao; resultado: ResultadoLote }) {
  const ok = resultado.sucesso.length;
  const falhas = resultado.falhas.length;
  const feito = acao === 'aprovar' ? 'aprovado' : 'reprovado';
  return (
    <>
      {ok > 0 && <p className="font-semibold text-[var(--color-success-text)]">{`✓ ${ok} ${plural(ok, `pedido ${feito}`, `pedidos ${feito}s`)}`}</p>}
      <p className="font-semibold text-[var(--color-danger-text)]">{`✕ ${falhas} ${plural(falhas, `não foi ${feito}`, `não foram ${feito}s`)}`}</p>
      <ul className="grid list-disc gap-1 pl-5">
        {resultado.falhas.map((f) => <li key={f.id}>{`${f.nome} — ${f.motivo}`}</li>)}
      </ul>
    </>
  );
}
