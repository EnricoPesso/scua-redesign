import { useId, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Drawer } from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { ApiError, mensagemParaUsuario } from '../domain/erros';
import { hojeLocal } from '../domain/formatacao';
import { paraNovoPedido } from '../domain/formPedido';
import { JUSTIFICATIVA_OUTRA, type Justificativa, type Pedido, type Permissoes, type Pessoa } from '../domain/types';
import { LIMITE_DETALHES, validarPedido, type FormPedido } from '../domain/validacao';
import { useCriarPedido, useEditarPedido } from '../hooks/mutations';
import { GrupoRadio } from './GrupoRadio';
import { useFocarAviso } from './useFocarAviso';
import { ResumoPedido } from './ResumoPedido';

/** Ordem em que o foco procura o primeiro campo inválido. */
const ORDEM: (keyof FormPedido)[] = ['beneficiarioId', 'dataInicial', 'dataFinal', 'inicio', 'fim', 'justificativaCodigo', 'detalhes'];
const ALTO_NO_CELULAR = 'max-md:h-11';

interface Props {
  modo: 'novo' | 'editar';
  pedidoId?: string;
  inicial: FormPedido;
  permissoes: Permissoes;
  justificativas: Justificativa[];
  colaboradores: Pessoa[];
  aoSucesso: (pedido: Pedido) => void;
  /** Fechar sem enviar (✕, Esc, Cancelar). */
  aoFechar: () => void;
}

interface Falha { mensagem: string; podeRepetir: boolean }

/** Marca o campo como "visitado" quando o foco sai dele, mesmo para componentes que não expõem onBlur. */
function SaidaDoCampo({ campo, aoSair, children }: { campo: keyof FormPedido; aoSair: (c: keyof FormPedido) => void; children: ReactNode }) {
  const aoPerderFoco = (e: FocusEvent<HTMLDivElement>) => {
    const proximo = e.relatedTarget as HTMLElement | null;
    if (proximo && (e.currentTarget.contains(proximo) || proximo.closest('[role="listbox"], [role="option"]'))) return;
    aoSair(campo);
  };
  return <div data-campo={campo} onBlur={aoPerderFoco}>{children}</div>;
}

export function textoSucesso(modo: 'novo' | 'editar', aprovador: Pessoa | null): string {
  if (modo === 'novo') return aprovador ? `Pedido enviado. ${aprovador.nome} vai receber o aviso.` : 'Pedido enviado. Quem aprova vai receber o aviso.';
  return aprovador
    ? `Pedido atualizado. ${aprovador.nome} vai receber o aviso da mudança.`
    : 'Pedido atualizado. Quem aprova vai receber o aviso da mudança.';
}

export function FormularioPedido(props: Props) {
  const { modo, pedidoId, inicial, permissoes, justificativas, colaboradores, aoSucesso, aoFechar } = props;
  const idFormulario = useId();
  const hoje = hojeLocal();
  const [form, setForm] = useState<FormPedido>(inicial);
  const [tocados, setTocados] = useState<ReadonlySet<keyof FormPedido>>(new Set());
  const [tentou, setTentou] = useState(false);
  const [erroDias, setErroDias] = useState<string>();
  const [falha, setFalha] = useState<Falha>();
  const refFalha = useFocarAviso<HTMLDivElement>(falha);
  const [enviando, setEnviando] = useState(false);
  const emAndamento = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const idContador = useId();
  const criar = useCriarPedido();
  const editar = useEditarPedido();

  const erros = validarPedido(form, hoje);
  const erroDe = (c: keyof FormPedido) => (tentou || tocados.has(c) ? erros[c] : undefined);
  const visitar = (c: keyof FormPedido) => setTocados((t) => (t.has(c) ? t : new Set(t).add(c)));
  const mudar = <C extends keyof FormPedido>(campo: C, valor: FormPedido[C]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    if (campo === 'dataInicial' || campo === 'dataFinal') setErroDias(undefined);
  };

  const beneficiarioEfetivo = form.paraQuem === 'mim' ? permissoes.usuario.id : form.beneficiarioId;
  const ehOutra = form.justificativaCodigo === JUSTIFICATIVA_OUTRA;
  const opcoesMotivo = [
    ...justificativas.map((j) => ({ value: j.codigo, label: j.descricao })),
    { value: JUSTIFICATIVA_OUTRA, label: 'Outra' },
  ];
  const opcoesPessoas = colaboradores.map((p) => ({ value: p.id, label: p.nome }));

  function focar(campo: keyof FormPedido) {
    const area = formRef.current?.querySelector(`[data-campo="${campo}"]`);
    area?.querySelector<HTMLElement>('[role="combobox"], textarea, input:not([type="hidden"]):not([aria-hidden="true"]), button')?.focus();
  }

  async function enviar() {
    if (emAndamento.current) return;
    setTentou(true);
    const primeiroInvalido = ORDEM.find((c) => erros[c]);
    if (primeiroInvalido) {
      focar(primeiroInvalido);
      return;
    }
    emAndamento.current = true;
    setEnviando(true);
    setFalha(undefined);
    const pedido = paraNovoPedido(form, permissoes.usuario.id);
    try {
      const salvo = modo === 'editar' && pedidoId
        ? await editar.mutateAsync({ id: pedidoId, pedido })
        : await criar.mutateAsync(pedido);
      // Depois de salvar o painel fecha: a trava fica ligada para um clique atrasado não gerar outro pedido.
      aoSucesso(salvo);
    } catch (erro) {
      console.error(erro);
      emAndamento.current = false;
      setEnviando(false);
      if (erro instanceof ApiError && erro.status === 409 && erro.codigo === 'PERIODO_CONFLITANTE') {
        setErroDias(mensagemParaUsuario(erro, 'enviar'));
        focar('dataInicial');
      } else {
        const naoEditavel = erro instanceof ApiError && erro.codigo === 'NAO_EDITAVEL';
        setFalha({ mensagem: mensagemParaUsuario(erro, 'enviar'), podeRepetir: !naoEditavel });
      }
    }
  }

  return (
    <Drawer
      open
      onOpenChange={(aberto) => { if (!aberto) aoFechar(); }}
      title={modo === 'editar' ? 'Editar extensão' : 'Nova extensão'}
      footer={
        <>
          <Button type="button" variant="secondary" className={ALTO_NO_CELULAR} onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form={idFormulario} className={ALTO_NO_CELULAR} loading={enviando}>Enviar pedido</Button>
        </>
      }
    >
    <form
      id={idFormulario}
      ref={formRef}
      noValidate
      aria-busy={enviando || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
      className="grid gap-5"
    >
      {falha && (
        <div ref={refFalha} tabIndex={-1} role="alert" className="grid gap-2 outline-none focus-visible:ring-3 focus-visible:ring-ring rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger-text)]">
          <p className="font-semibold">{falha.mensagem}</p>
          {falha.podeRepetir && (
            <Button type="button" variant="secondary" className={`w-fit ${ALTO_NO_CELULAR}`} loading={enviando} onClick={() => void enviar()}>
              Tentar de novo
            </Button>
          )}
        </div>
      )}

      {permissoes.podePedirParaOutros && (
        <div className="grid gap-3">
          <GrupoRadio
            legenda="Para quem?"
            valor={form.paraQuem}
            aoMudar={(v) => mudar('paraQuem', v)}
            opcoes={[{ valor: 'mim', rotulo: 'Para mim' }, { valor: 'outro', rotulo: 'Para outra pessoa' }]}
          />
          {form.paraQuem === 'outro' && (
            <SaidaDoCampo campo="beneficiarioId" aoSair={visitar}>
              <Select
                label="Colaborador"
                placeholder="Escolha o colaborador"
                options={opcoesPessoas}
                value={form.beneficiarioId || null}
                onValueChange={(v) => { mudar('beneficiarioId', v ?? ''); visitar('beneficiarioId'); }}
                error={erroDe('beneficiarioId')}
                className="max-md:[&_[role=combobox]]:h-11 max-md:[&_button]:h-11"
              />
            </SaidaDoCampo>
          )}
        </div>
      )}

      <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
        <legend className="mb-1 p-0 text-sm font-bold text-foreground">Dias</legend>
        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2">
          <SaidaDoCampo campo="dataInicial" aoSair={visitar}>
            <DateField
              label="Primeiro dia"
              name="dataInicial"
              className="max-md:[&_input]:h-11"
              min={hoje}
              value={form.dataInicial}
              onChange={(v) => mudar('dataInicial', v)}
              error={erroDe('dataInicial') ?? erroDias}
            />
          </SaidaDoCampo>
          <SaidaDoCampo campo="dataFinal" aoSair={visitar}>
            <DateField
              label="Último dia (opcional)"
              name="dataFinal"
              className="max-md:[&_input]:h-11"
              min={form.dataInicial || hoje}
              value={form.dataFinal}
              onChange={(v) => mudar('dataFinal', v)}
              error={erroDe('dataFinal')}
              hint="Deixe em branco para um dia só."
            />
          </SaidaDoCampo>
        </div>
      </fieldset>

      <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
        <legend className="mb-1 p-0 text-sm font-bold text-foreground">
          Horário <span className="font-normal text-[var(--color-text-muted)]">(vale para cada dia)</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <SaidaDoCampo campo="inicio" aoSair={visitar}>
            <Field
              label="Início"
              error={erroDe('inicio')}
              inputProps={{ type: 'time', name: 'inicio', value: form.inicio, onValueChange: (v: string) => mudar('inicio', v), className: ALTO_NO_CELULAR }}
            />
          </SaidaDoCampo>
          <SaidaDoCampo campo="fim" aoSair={visitar}>
            <Field
              label="Fim"
              error={erroDe('fim')}
              inputProps={{ type: 'time', name: 'fim', value: form.fim, onValueChange: (v: string) => mudar('fim', v), className: ALTO_NO_CELULAR }}
            />
          </SaidaDoCampo>
        </div>
      </fieldset>

      <div className="grid gap-4">
        <SaidaDoCampo campo="justificativaCodigo" aoSair={visitar}>
          <Select
            label="Por quê?"
            placeholder="Selecione o motivo"
            options={opcoesMotivo}
            value={form.justificativaCodigo || null}
            onValueChange={(v) => { mudar('justificativaCodigo', v ?? ''); visitar('justificativaCodigo'); }}
            error={erroDe('justificativaCodigo')}
            className="max-md:[&_[role=combobox]]:h-11 max-md:[&_button]:h-11"
          />
        </SaidaDoCampo>
        <SaidaDoCampo campo="detalhes" aoSair={visitar}>
          <div className="grid gap-1">
            <Field
              label={ehOutra ? 'Detalhes (obrigatório)' : 'Detalhes (opcional)'}
              error={erroDe('detalhes')}
              inputProps={{
                name: 'detalhes',
                value: form.detalhes,
                onValueChange: (v: string) => mudar('detalhes', v),
                render: <textarea rows={4} aria-describedby={idContador} />,
                className: 'h-auto min-h-24 py-2',
              }}
            />
            <p id={idContador} className="text-right text-xs text-[var(--color-text-muted)]">
              {form.detalhes.length}/{LIMITE_DETALHES}
            </p>
          </div>
        </SaidaDoCampo>
      </div>

      <ResumoPedido
        dataInicial={form.dataInicial}
        dataFinal={form.dataFinal}
        horario={{ inicio: form.inicio, fim: form.fim }}
        beneficiarioId={beneficiarioEfetivo}
        hoje={hoje}
      />
    </form>
    </Drawer>
  );
}
