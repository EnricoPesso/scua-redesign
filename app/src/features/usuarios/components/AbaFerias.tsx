import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateField } from '@/components/ui/date-field';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/use-toast';
import { mensagemDeErro } from '../../../lib/mensagens';
import { hoje } from '../../../mock/datas';
import { adicionarFerias, removerFerias } from '../api';
import { dataCurta } from '../domain/formatacao';
import type { Ferias, NovasFerias } from '../domain/tipos';
import { semErros, validarFerias, type CampoFerias, type Erros } from '../domain/validacao';
import { AVISO_DE_FALHA, focarPrimeiroInvalido, useFocarAviso, useGravar, type PropsAba } from './apoio';

const VAZIAS: NovasFerias = { inicio: '', fim: '' };
const periodo = (f: { inicio: string; fim: string }, ano: string) => `${dataCurta(f.inicio, ano)} a ${dataCurta(f.fim, ano)}`;

export function AbaFerias({ usuario }: PropsAba) {
  const toast = useToast();
  const gravar = useGravar(usuario.id);
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState<Ferias | null>(null);
  const ano = hoje().slice(0, 4);
  const ordenadas = [...usuario.ferias].sort((a, b) => a.inicio.localeCompare(b.inicio));

  const remover = useMutation({
    mutationFn: (f: Ferias) => removerFerias(usuario.id, f.id),
    onSuccess: (u, f) => {
      gravar(u);
      setRemovendo(null);
      toast.success(`Férias de ${periodo(f, ano)} removidas.`);
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
        <p className="max-w-md text-sm text-muted-foreground">Nos períodos de férias, a pessoa não precisa cumprir a jornada.</p>
        {!adicionando && <Button type="button" className="max-md:h-11" onClick={() => setAdicionando(true)}><PlusIcon aria-hidden="true" />Adicionar férias</Button>}
      </div>

      {adicionando && <FormularioFerias usuarioId={usuario.id} existentes={usuario.ferias} aoFechar={() => setAdicionando(false)} />}

      {ordenadas.length === 0 ? (
        !adicionando && <EmptyState title="Nenhum período de férias" description={`Quando ${usuario.nome} tiver férias marcadas, os períodos aparecem aqui.`} />
      ) : (
        <ul aria-label="Períodos de férias" className="grid gap-2">
          {ordenadas.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
              <span className="text-sm font-semibold text-foreground">{periodo(f, ano)}</span>
              <Button type="button" variant="secondary" className="max-md:h-11" aria-label={`Remover férias de ${periodo(f, ano)}`} onClick={() => setRemovendo(f)}>Remover</Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removendo !== null}
        onOpenChange={(a) => { if (!a) setRemovendo(null); }}
        title={removendo ? `Remover as férias de ${periodo(removendo, ano)}?` : ''}
        description="Neste período, a pessoa volta a ter que cumprir a jornada."
        confirmLabel="Remover"
        destructive
        loading={remover.isPending}
        onConfirm={() => { if (removendo) remover.mutate(removendo); }}
      />
    </div>
  );
}

function FormularioFerias({ usuarioId, existentes, aoFechar }: { usuarioId: string; existentes: Ferias[]; aoFechar: () => void }) {
  const toast = useToast();
  const gravar = useGravar(usuarioId);
  const area = useRef<HTMLFormElement>(null);
  const [dados, setDados] = useState<NovasFerias>(VAZIAS);
  const [erros, setErros] = useState<Erros<CampoFerias>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const refFalha = useFocarAviso<HTMLParagraphElement>(falha);
  const ano = hoje().slice(0, 4);

  useEffect(() => { area.current?.querySelector<HTMLElement>('input')?.focus(); }, []);

  const salvar = useMutation({
    mutationFn: (d: NovasFerias) => adicionarFerias(usuarioId, d),
    onSuccess: (u, d) => {
      gravar(u);
      toast.success(`Férias de ${periodo(d, ano)} adicionadas.`);
      aoFechar();
    },
    onError: (erro) => {
      console.error(erro);
      setFalha(mensagemDeErro(erro, 'salvar'));
    },
  });

  const mudar = (chave: keyof NovasFerias, valor: string) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    // Mudar qualquer data pode resolver tanto o erro do início (sobreposição) quanto o do fim.
    setErros({});
  };
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    const novos = validarFerias(dados, existentes, ano);
    setErros(novos);
    if (!semErros(novos)) {
      focarPrimeiroInvalido(area);
      return;
    }
    setFalha(null);
    salvar.mutate(dados);
  };

  return (
    <form ref={area} noValidate aria-label="Novas férias" onSubmit={enviar} className="grid gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
      {falha && <p ref={refFalha} tabIndex={-1} role="alert" className={AVISO_DE_FALHA}>{falha}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField label="Início *" value={dados.inicio} error={erros.inicio} onChange={(v) => mudar('inicio', v)} className="max-md:[&_input]:h-11" />
        <DateField label="Fim *" min={dados.inicio || undefined} value={dados.fim} error={erros.fim} onChange={(v) => mudar('fim', v)} className="max-md:[&_input]:h-11" />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" className="max-md:h-11 max-md:flex-1" disabled={salvar.isPending} onClick={aoFechar}>Cancelar</Button>
        <Button type="submit" className="max-md:h-11 max-md:flex-1" loading={salvar.isPending}>Salvar férias</Button>
      </div>
    </form>
  );
}
