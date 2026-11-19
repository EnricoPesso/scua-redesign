import { useId, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/components/ui/use-toast';
import { mensagemDeErro } from '../../../lib/mensagens';
import { AssistenteNoFormulario } from '../../assistente/Bolha';
import { useAlvoDoAssistente } from '../../assistente/estado';
import { aplicarNaJornada, CAMPOS_DA_JORNADA } from '../assistente';
import { salvarJornada } from '../api';
import { cargaSemanal, copiarSegundaParaDiasUteis, resumirHorario } from '../domain/horario';
import { TIPOS_DE_JORNADA, type DadosJornada, type Dia, type HorarioDia, type Jornada } from '../domain/tipos';
import { temErros, validarJornada, type ErrosJornada } from '../domain/validacao';
import { CHAVE_JORNADAS, useFocarAviso } from './apoio';
import { GradeSemana } from './GradeSemana';

const OPCOES_TIPO = TIPOS_DE_JORNADA.map((t) => ({ value: t, label: t }));
/** Destaque dos campos preenchidos pelo assistente, até a pessoa mexer neles. */
const DESTAQUE = 'rounded-md data-[ia]:outline-2 data-[ia]:outline-offset-4 data-[ia]:outline-[var(--color-brand)]';
const AVISO = 'rounded-md bg-[var(--color-danger-bg)] p-3 text-sm font-semibold text-[var(--color-danger-text)] outline-none focus-visible:ring-3 focus-visible:ring-ring';

const vazia = (): DadosJornada => {
  const folga: HorarioDia = { trabalha: false, entrada: '', saida: '', intervaloInicio: '', intervaloFim: '' };
  const util: HorarioDia = { trabalha: true, entrada: '08:00', saida: '17:00', intervaloInicio: '12:00', intervaloFim: '13:00' };
  return {
    identificador: '', descricao: '', tipo: '', ativa: true, padrao: false, liberaRegra: false, informativa: false,
    semana: { seg: util, ter: util, qua: util, qui: util, sex: util, sab: folga, dom: folga },
  };
};

/** `atual` ausente = jornada nova. `todas` serve para conferir identificador repetido e avisar da troca de padrão. */
export function FormularioJornada({ atual, todas, aoFechar }: { atual?: Jornada; todas: Jornada[]; aoFechar: () => void }) {
  const idForm = useId();
  const area = useRef<HTMLFormElement>(null);
  const client = useQueryClient();
  const toast = useToast();
  const [dados, setDadosDoEstado] = useState<DadosJornada>(() => {
    if (!atual) return vazia();
    const { id, ...resto } = atual;
    void id;
    return structuredClone(resto);
  });
  // Os dados mais recentes também ficam numa ref: o assistente preenche e pode salvar em seguida,
  // antes de a tela desenhar de novo.
  const dadosRef = useRef(dados);
  const setDados = (mudar: (d: DadosJornada) => DadosJornada) => {
    dadosRef.current = mudar(dadosRef.current);
    setDadosDoEstado(dadosRef.current);
  };
  // Campos preenchidos pelo assistente e ainda não mexidos pela pessoa ('identificador', 'semana.seg'…).
  const [daIA, setDaIA] = useState<ReadonlySet<string>>(new Set());
  const daIARef = useRef(daIA);
  const definirDaIA = (novo: ReadonlySet<string>) => { daIARef.current = novo; setDaIA(novo); };
  const desmarcar = (chave: string) => {
    if (!daIARef.current.has(chave)) return;
    const novo = new Set(daIARef.current);
    novo.delete(chave);
    definirDaIA(novo);
  };
  const [erros, setErros] = useState<ErrosJornada>({ dias: {} });
  const [falha, setFalha] = useState<string | null>(null);
  const refFalha = useFocarAviso<HTMLParagraphElement>(falha);
  const refSemana = useRef<HTMLParagraphElement>(null);

  const salvar = useMutation({
    mutationFn: (v: { dados: DadosJornada; viaAssistente: boolean }) => salvarJornada(atual?.id ?? null, v.dados, { viaAssistente: v.viaAssistente }),
    onSuccess: (salva) => {
      toast.success(`Jornada ${salva.identificador} ${atual ? 'atualizada' : 'adicionada'}.`);
      void client.invalidateQueries({ queryKey: CHAVE_JORNADAS });
      aoFechar();
    },
    onError: (erro) => {
      console.error(erro);
      setFalha(mensagemDeErro(erro, 'salvar'));
    },
  });

  const mudar = <K extends keyof DadosJornada>(chave: K, valor: DadosJornada[K]) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    setErros((e) => ({ ...e, [chave]: undefined }));
    desmarcar(chave);
  };
  const mudarDia = (dia: Dia, mudancas: Partial<HorarioDia>) => {
    setDados((d) => ({ ...d, semana: { ...d.semana, [dia]: { ...d.semana[dia], ...mudancas } } }));
    setErros((e) => ({ ...e, semana: undefined, dias: { ...e.dias, [dia]: undefined } }));
    desmarcar(`semana.${dia}`);
  };

  /** Valida os dados atuais e mostra os erros. Devolve true se pode salvar. */
  const validar = (): boolean => {
    const novos = validarJornada(dadosRef.current, todas, atual?.id);
    // Remove dias sem erro para o objeto ficar enxuto.
    novos.dias = Object.fromEntries(Object.entries(novos.dias).filter(([, v]) => v && Object.keys(v).length > 0));
    setErros(novos);
    return !temErros(novos);
  };

  // O assistente de IA enxerga este formulário: preenche os campos e, com aprovação automática, salva.
  useAlvoDoAssistente({
    alvo: { tipo: 'formulario', id: 'jornada', titulo: atual ? `Jornada ${atual.identificador}` : 'Nova jornada de trabalho', campos: CAMPOS_DA_JORNADA, valores: { ...dados } },
    aplicar: (campos) => {
      const r = aplicarNaJornada(dadosRef.current, campos);
      setDados(() => r.dados);
      definirDaIA(new Set([...daIARef.current, ...r.chaves]));
      setErros({ dias: {} });
      return r.resultado;
    },
    salvar: async () => {
      if (salvar.isPending) return { ok: false, mensagem: 'Já estou salvando.' };
      if (!validar()) return { ok: false, mensagem: 'Não salvei: há campos para corrigir no formulário.' };
      setFalha(null);
      try {
        const salva = await salvar.mutateAsync({ dados: dadosRef.current, viaAssistente: true });
        return { ok: true, mensagem: `Salvei a jornada ${salva.identificador}.` };
      } catch {
        return { ok: false, mensagem: 'Não salvei: o sistema recusou. Veja o aviso no formulário.' };
      }
    },
  });

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    if (!validar()) {
      // Espera a tela marcar os campos como inválidos antes de procurar o primeiro.
      setTimeout(() => {
        const primeiro = area.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        else refSemana.current?.focus();
      }, 0);
      return;
    }
    setFalha(null);
    // Se ainda há campos preenchidos pelo assistente e não mexidos, a gravação conta como feita com ele.
    salvar.mutate({ dados: dadosRef.current, viaAssistente: daIARef.current.size > 0 });
  };

  const outroPadrao = todas.find((j) => j.padrao && j.id !== atual?.id);
  const ehOPadrao = Boolean(atual?.padrao);

  return (
    <Drawer
      open
      onOpenChange={(a) => { if (!a && !salvar.isPending) aoFechar(); }}
      title={atual ? `Editar jornada ${atual.identificador}` : 'Nova jornada'}
      className="md:max-w-3xl"
      footer={
        <>
          <Button type="button" variant="secondary" className="max-md:h-11 max-md:flex-1" disabled={salvar.isPending} onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form={idForm} className="max-md:h-11 max-md:flex-1" loading={salvar.isPending}>Salvar</Button>
        </>
      }
    >
      <form id={idForm} ref={area} noValidate onSubmit={enviar} className="grid gap-5">
        {falha && <p ref={refFalha} tabIndex={-1} role="alert" className={AVISO}>{falha}</p>}
        <AssistenteNoFormulario exemplo={'Ex.: "seg a sex, 8h às 17h, almoço 12 às 13, nome ADM-8H"'} />
        {daIA.size > 0 && (
          <p role="status" className="rounded-md border border-[var(--color-brand)] bg-[var(--color-surface-muted)] p-3 text-sm font-semibold text-foreground">
            Preenchido pelo assistente. Confira antes de salvar.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div data-ia={daIA.has('identificador') || undefined} className={DESTAQUE}>
            <Field label="Identificador *" hint="Código curto e único, como ADM-8H." error={erros.identificador}
              inputProps={{ value: dados.identificador, maxLength: 20, onValueChange: (v: string) => mudar('identificador', v), className: 'max-md:h-11' }} />
          </div>
          <div data-ia={daIA.has('tipo') || undefined} className={DESTAQUE}>
            <Select label="Tipo *" placeholder="Selecione" options={OPCOES_TIPO} value={dados.tipo || null} error={erros.tipo}
              onValueChange={(v) => mudar('tipo', v ?? '')} className="max-md:[&_[role=combobox]]:h-11" />
          </div>
        </div>
        <div data-ia={daIA.has('descricao') || undefined} className={DESTAQUE}>
          <Field label="Descrição *" error={erros.descricao}
            inputProps={{ value: dados.descricao, maxLength: 80, onValueChange: (v: string) => mudar('descricao', v), className: 'max-md:h-11' }} />
        </div>

        <fieldset data-ia={['ativa', 'padrao', 'liberaRegra', 'informativa'].some((c) => daIA.has(c)) || undefined} className={`grid gap-3 ${DESTAQUE}`}>
          <legend className="mb-1 text-sm font-bold text-foreground">Opções</legend>
          <Opcao rotulo="Ativa" dica="Só jornadas ativas podem ser atribuídas às pessoas." marcado={dados.ativa} aoMudar={(c) => mudar('ativa', c)} />
          <div className="grid gap-1">
            <Toggle label="Padrão" checked={dados.padrao} disabled={ehOPadrao} onCheckedChange={(c) => mudar('padrao', c)} className="max-md:min-h-11" />
            <p className="text-xs text-muted-foreground">
              {ehOPadrao ? 'Esta é a jornada padrão. Para trocar, marque outra jornada como padrão.' : 'É usada por quem não tem uma jornada própria. Só uma jornada pode ser a padrão.'}
            </p>
            {erros.padrao && <p role="alert" className="text-xs font-semibold text-[var(--color-danger-text)]">{erros.padrao}</p>}
            {dados.padrao && !ehOPadrao && outroPadrao && (
              <p role="status" className="text-xs font-semibold text-foreground">Ao salvar, {outroPadrao.identificador} deixa de ser a jornada padrão.</p>
            )}
          </div>
          <Opcao rotulo="Libera regra" dica="Quem usa esta jornada pode liberar regras de bloqueio da estação." marcado={dados.liberaRegra} aoMudar={(c) => mudar('liberaRegra', c)} />
          <Opcao rotulo="Informativa" dica="Só registra os horários, sem bloquear a estação fora do expediente." marcado={dados.informativa} aoMudar={(c) => mudar('informativa', c)} />
        </fieldset>

        <section aria-labelledby={`${idForm}-semana`} data-ia={[...daIA].some((c) => c.startsWith('semana.')) || undefined} className={`grid gap-3 ${DESTAQUE}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id={`${idForm}-semana`} className="text-sm font-bold text-foreground">Horários da semana</h3>
            <Button type="button" variant="secondary" className="max-md:h-11" onClick={() => setDados((d) => ({ ...d, semana: copiarSegundaParaDiasUteis(d.semana) }))}>
              Copiar segunda para os dias úteis
            </Button>
          </div>
          {erros.semana && <p ref={refSemana} tabIndex={-1} role="alert" className="text-sm font-semibold text-[var(--color-danger-text)] outline-none focus-visible:ring-3 focus-visible:ring-ring">{erros.semana}</p>}
          <GradeSemana semana={dados.semana} erros={erros.dias} aoMudar={mudarDia} />
        </section>

        <p aria-live="polite" className="rounded-md bg-[var(--color-surface-muted)] p-3 text-sm text-foreground">
          <span className="font-semibold">Resumo: </span>{resumirHorario(dados.semana)}. Carga semanal de {cargaSemanal(dados.semana)}.
        </p>
      </form>
    </Drawer>
  );
}

function Opcao({ rotulo, dica, marcado, aoMudar }: { rotulo: string; dica: string; marcado: boolean; aoMudar: (c: boolean) => void }) {
  return (
    <div className="grid gap-1">
      <Toggle label={rotulo} checked={marcado} onCheckedChange={aoMudar} className="max-md:min-h-11" />
      <p className="text-xs text-muted-foreground">{dica}</p>
    </div>
  );
}
