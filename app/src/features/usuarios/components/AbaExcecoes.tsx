import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateField } from '@/components/ui/date-field';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { mensagemDeErro } from '../../../lib/mensagens';
import { hoje } from '../../../mock/datas';
import { adicionarExcecao, removerExcecao } from '../api';
import { dataCurta, faixaDeHoras } from '../domain/formatacao';
import type { Excecao, NovaExcecao } from '../domain/tipos';
import { semErros, validarExcecao, type CampoExcecao, type Erros } from '../domain/validacao';
import { AVISO_DE_FALHA, focarPrimeiroInvalido, useFocarAviso, useGravar, type PropsAba } from './apoio';

const VAZIA: NovaExcecao = { data: '', entrada: '', saida: '', motivo: '' };

export function AbaExcecoes({ usuario }: PropsAba) {
  const toast = useToast();
  const gravar = useGravar(usuario.id);
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState<Excecao | null>(null);
  const ano = hoje().slice(0, 4);
  const ordenadas = [...usuario.excecoes].sort((a, b) => a.data.localeCompare(b.data));

  const remover = useMutation({
    mutationFn: (e: Excecao) => removerExcecao(usuario.id, e.id),
    onSuccess: (u, e) => {
      gravar(u);
      setRemovendo(null);
      toast.success(`Exceção de ${dataCurta(e.data, ano)} removida.`);
    },
    onError: (erro) => {
      console.error(erro);
      setRemovendo(null);
      toast.error(mensagemDeErro(erro, 'excluir'));
    },
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-md text-sm text-muted-foreground">Exceções mudam o horário de um dia específico, como uma consulta ou um evento.</p>
        {!adicionando && <Button type="button" className="max-md:h-11" onClick={() => setAdicionando(true)}><PlusIcon aria-hidden="true" />Adicionar exceção</Button>}
      </div>

      {adicionando && <FormularioExcecao usuarioId={usuario.id} existentes={usuario.excecoes} aoFechar={() => setAdicionando(false)} />}

      {ordenadas.length === 0 ? (
        !adicionando && <EmptyState title="Nenhuma exceção de jornada" description={`${usuario.nome} segue o horário da jornada ${usuario.jornadaNome} em todos os dias.`} />
      ) : (
        <ul aria-label="Exceções de jornada" className="grid gap-2">
          {ordenadas.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
              <div className="grid min-w-0 gap-0.5 text-sm">
                <span className="font-semibold text-foreground">{dataCurta(e.data, ano)} · {faixaDeHoras(e.entrada, e.saida)}</span>
                <span className="text-muted-foreground">{e.motivo}</span>
              </div>
              <Button type="button" variant="secondary" className="max-md:h-11" aria-label={`Remover exceção de ${dataCurta(e.data, ano)}`} onClick={() => setRemovendo(e)}>Remover</Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removendo !== null}
        onOpenChange={(a) => { if (!a) setRemovendo(null); }}
        title={removendo ? `Remover a exceção de ${dataCurta(removendo.data, ano)}?` : ''}
        description="Neste dia, a pessoa volta a seguir o horário normal da jornada."
        confirmLabel="Remover"
        destructive
        loading={remover.isPending}
        onConfirm={() => { if (removendo) remover.mutate(removendo); }}
      />
    </div>
  );
}

function FormularioExcecao({ usuarioId, existentes, aoFechar }: { usuarioId: string; existentes: Excecao[]; aoFechar: () => void }) {
  const toast = useToast();
  const gravar = useGravar(usuarioId);
  const area = useRef<HTMLFormElement>(null);
  const [dados, setDados] = useState<NovaExcecao>(VAZIA);
  const [erros, setErros] = useState<Erros<CampoExcecao>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const refFalha = useFocarAviso<HTMLParagraphElement>(falha);
  const ano = hoje().slice(0, 4);

  useEffect(() => { area.current?.querySelector<HTMLElement>('input')?.focus(); }, []);

  const salvar = useMutation({
    mutationFn: (d: NovaExcecao) => adicionarExcecao(usuarioId, d),
    onSuccess: (u, d) => {
      gravar(u);
      toast.success(`Exceção de ${dataCurta(d.data, ano)} adicionada.`);
      aoFechar();
    },
    onError: (erro) => {
      console.error(erro);
      setFalha(mensagemDeErro(erro, 'salvar'));
    },
  });

  const mudar = <K extends keyof NovaExcecao>(chave: K, valor: NovaExcecao[K]) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    setErros((e) => ({ ...e, [chave]: undefined }));
  };
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    const novos = validarExcecao(dados, existentes, hoje());
    setErros(novos);
    if (!semErros(novos)) {
      focarPrimeiroInvalido(area);
      return;
    }
    setFalha(null);
    salvar.mutate(dados);
  };

  return (
    <form ref={area} noValidate aria-label="Nova exceção" onSubmit={enviar} className="grid gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
      {falha && <p ref={refFalha} tabIndex={-1} role="alert" className={AVISO_DE_FALHA}>{falha}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <DateField label="Data *" min={hoje()} value={dados.data} error={erros.data} onChange={(v) => mudar('data', v)} className="max-md:[&_input]:h-11" />
        <Field label="Entrada *" error={erros.entrada} inputProps={{ type: 'time', value: dados.entrada, onValueChange: (v: string) => mudar('entrada', v), className: 'max-md:h-11' }} />
        <Field label="Saída *" error={erros.saida} inputProps={{ type: 'time', value: dados.saida, onValueChange: (v: string) => mudar('saida', v), className: 'max-md:h-11' }} />
      </div>
      <Field label="Motivo *" error={erros.motivo} inputProps={{ value: dados.motivo, maxLength: 80, onValueChange: (v: string) => mudar('motivo', v), className: 'max-md:h-11' }} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" className="max-md:h-11 max-md:flex-1" disabled={salvar.isPending} onClick={aoFechar}>Cancelar</Button>
        <Button type="submit" className="max-md:h-11 max-md:flex-1" loading={salvar.isPending}>Salvar exceção</Button>
      </div>
    </form>
  );
}
