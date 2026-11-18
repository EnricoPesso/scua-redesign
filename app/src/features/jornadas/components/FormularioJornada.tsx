import { useId, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/components/ui/use-toast';
import { mensagemDeErro } from '../../../lib/mensagens';
import { salvarJornada } from '../api';
import { cargaSemanal, copiarSegundaParaDiasUteis, resumirHorario } from '../domain/horario';
import { TIPOS_DE_JORNADA, type DadosJornada, type Dia, type HorarioDia, type Jornada } from '../domain/tipos';
import { temErros, validarJornada, type ErrosJornada } from '../domain/validacao';
import { CHAVE_JORNADAS, useFocarAviso } from './apoio';
import { GradeSemana } from './GradeSemana';

const OPCOES_TIPO = TIPOS_DE_JORNADA.map((t) => ({ value: t, label: t }));
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
  const [dados, setDados] = useState<DadosJornada>(() => {
    if (!atual) return vazia();
    const { id, ...resto } = atual;
    void id;
    return structuredClone(resto);
  });
  const [erros, setErros] = useState<ErrosJornada>({ dias: {} });
  const [falha, setFalha] = useState<string | null>(null);
  const refFalha = useFocarAviso<HTMLParagraphElement>(falha);
  const refSemana = useRef<HTMLParagraphElement>(null);

  const salvar = useMutation({
    mutationFn: (d: DadosJornada) => salvarJornada(atual?.id ?? null, d),
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
  };
  const mudarDia = (dia: Dia, mudancas: Partial<HorarioDia>) => {
    setDados((d) => ({ ...d, semana: { ...d.semana, [dia]: { ...d.semana[dia], ...mudancas } } }));
    setErros((e) => ({ ...e, semana: undefined, dias: { ...e.dias, [dia]: undefined } }));
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    const novos = validarJornada(dados, todas, atual?.id);
    // Remove dias sem erro para o objeto ficar enxuto.
    novos.dias = Object.fromEntries(Object.entries(novos.dias).filter(([, v]) => v && Object.keys(v).length > 0));
    setErros(novos);
    if (temErros(novos)) {
      // Espera a tela marcar os campos como inválidos antes de procurar o primeiro.
      setTimeout(() => {
        const primeiro = area.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        else refSemana.current?.focus();
      }, 0);
      return;
    }
    setFalha(null);
    salvar.mutate(dados);
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

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Identificador *" hint="Código curto e único, como ADM-8H." error={erros.identificador}
            inputProps={{ value: dados.identificador, maxLength: 20, onValueChange: (v: string) => mudar('identificador', v), className: 'max-md:h-11' }} />
          <Select label="Tipo *" placeholder="Selecione" options={OPCOES_TIPO} value={dados.tipo || null} error={erros.tipo}
            onValueChange={(v) => mudar('tipo', v ?? '')} className="max-md:[&_[role=combobox]]:h-11" />
        </div>
        <Field label="Descrição *" error={erros.descricao}
          inputProps={{ value: dados.descricao, maxLength: 80, onValueChange: (v: string) => mudar('descricao', v), className: 'max-md:h-11' }} />

        <fieldset className="grid gap-3">
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

        <section aria-labelledby={`${idForm}-semana`} className="grid gap-3">
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
