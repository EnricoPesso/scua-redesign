import { useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { mensagemDeErro } from '../../../lib/mensagens';
import { excluirJornada } from '../api';
import type { Jornada } from '../domain/tipos';
import { CHAVE_JORNADAS, Carregando, useJornadas } from './apoio';
import { BotaoExportar } from '../../../componentes/BotaoExportar';
import { COLUNAS_PLANILHA } from '../planilha';
import { TabelaJornadas } from './TabelaJornadas';

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function JornadasPage() {
  const [params, setParams] = useSearchParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const toast = useToast();
  const lista = useJornadas();
  const busca = params.get('q') ?? '';
  const [excluindo, setExcluindo] = useState<Jornada | null>(null);
  const [bloqueada, setBloqueada] = useState<Jornada | null>(null);

  const mudarBusca = (q: string) => setParams((p) => {
    const n = new URLSearchParams(p);
    if (q) n.set('q', q);
    else n.delete('q');
    return n;
  }, { replace: true });

  const itens = useMemo(() => {
    const termo = semAcento(busca.trim());
    const todas = lista.data ?? [];
    if (!termo) return todas;
    return todas.filter((j) => semAcento(`${j.identificador} ${j.descricao}`).includes(termo));
  }, [lista.data, busca]);

  const excluir = useMutation({
    mutationFn: (j: Jornada) => excluirJornada(j.id),
    onSuccess: (_, j) => {
      toast.success(`Jornada ${j.identificador} excluída.`);
      setExcluindo(null);
      void client.invalidateQueries({ queryKey: CHAVE_JORNADAS });
    },
    onError: (erro) => {
      console.error(erro);
      toast.error(mensagemDeErro(erro, 'excluir'));
      setExcluindo(null);
    },
  });

  // A jornada padrão não sai: explica o porquê em vez de só desabilitar o botão.
  const pedirExclusao = (j: Jornada) => (j.padrao ? setBloqueada(j) : setExcluindo(j));
  const total = lista.data?.length ?? 0;
  const novo = { pathname: '/jornadas/nova', search };

  let corpo;
  if (lista.isPending) {
    corpo = <Carregando rotulo="Carregando jornadas" />;
  } else if (lista.isError) {
    corpo = <EstadoErro erro={lista.error} aoTentar={() => void lista.refetch()} />;
  } else if (total === 0) {
    corpo = (
      <EmptyState
        title="Nenhuma jornada cadastrada"
        description="As jornadas definem os horários de trabalho de cada pessoa. Adicione a primeira para começar."
        action={<Link to={novo} className={cn(buttonVariants(), 'max-md:h-11')}><PlusIcon aria-hidden="true" />Adicionar jornada</Link>}
      />
    );
  } else {
    corpo = (
      <>
        <Field
          className="max-w-sm"
          label="Buscar"
          inputProps={{ type: 'search', value: busca, placeholder: 'Identificador ou descrição', onValueChange: (v: string) => mudarBusca(v), className: 'max-md:h-11' }}
        />
        <p role="status" className="text-sm text-muted-foreground">
          {busca ? `${itens.length} ${itens.length === 1 ? 'jornada encontrada' : 'jornadas encontradas'}` : `${total} ${total === 1 ? 'jornada' : 'jornadas'}`}
        </p>
        {itens.length === 0 ? (
          <EmptyState
            title={`Nenhuma jornada encontrada para “${busca}”`}
            description="Confira a escrita ou limpe a busca."
            action={<Button variant="secondary" className="max-md:h-11" onClick={() => mudarBusca('')}>Limpar busca</Button>}
          />
        ) : (
          <TabelaJornadas jornadas={itens} aoExcluir={pedirExclusao} />
        )}
      </>
    );
  }

  return (
    <Pagina
      titulo="Jornadas de trabalho"
      descricao="Horários de trabalho que podem ser atribuídos às pessoas."
      acoes={total === 0 ? undefined : (
        <>
          <BotaoExportar arquivo="jornadas-de-trabalho" colunas={COLUNAS_PLANILHA} linhas={itens} />
          <Link to={novo} className={buttonVariants()}><PlusIcon aria-hidden="true" />Adicionar jornada</Link>
        </>
      )}
    >
      {corpo}
      <Outlet />

      <ConfirmDialog
        open={excluindo !== null}
        onOpenChange={(a) => { if (!a) setExcluindo(null); }}
        title={excluindo ? `Excluir a jornada ${excluindo.identificador}?` : ''}
        description="Esta ação não pode ser desfeita. Quem usa esta jornada fica sem jornada própria."
        confirmLabel="Excluir"
        destructive
        loading={excluir.isPending}
        onConfirm={() => { if (excluindo) excluir.mutate(excluindo); }}
      />
      <ConfirmDialog
        open={bloqueada !== null}
        onOpenChange={(a) => { if (!a) setBloqueada(null); }}
        title={bloqueada ? `Não dá para excluir a jornada ${bloqueada.identificador}` : ''}
        description="Ela é a jornada padrão, usada por quem não tem uma jornada própria. Para excluí-la, marque outra jornada como padrão antes."
        confirmLabel="Escolher outra padrão"
        cancelLabel="Fechar"
        onConfirm={() => {
          setBloqueada(null);
          const outra = lista.data?.find((j) => j.id !== bloqueada?.id && j.ativa);
          void navigate({ pathname: outra ? `/jornadas/${outra.id}` : '/jornadas', search });
        }}
      />
    </Pagina>
  );
}
