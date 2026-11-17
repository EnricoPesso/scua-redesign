import type { ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, mensagemParaUsuario } from '../domain/erros';
import { formDoPedido, formPedirDeNovo, formVazio } from '../domain/formPedido';
import type { Pedido, Pessoa } from '../domain/types';
import { useColaboradores, useJustificativas, usePedido, usePermissoes } from '../hooks/queries';
import { FormularioPedido, textoSucesso } from './FormularioPedido';
import { useAvisar } from './useAvisar';
import { useFecharPainel } from './useFecharPainel';

export function PainelMensagem({ titulo, children, aoFechar, aoTentar }: { titulo: string; children: ReactNode; aoFechar: () => void; aoTentar?: () => void }) {
  return (
    <Drawer
      open
      onOpenChange={(aberto) => { if (!aberto) aoFechar(); }}
      title={titulo}
      footer={
        <>
          {aoTentar && <Button variant="secondary" className="max-md:h-11" onClick={aoTentar}>Tentar de novo</Button>}
          <Button className="max-md:h-11" onClick={aoFechar}>Fechar</Button>
        </>
      }
    >
      {children}
    </Drawer>
  );
}

export const Carregando = ({ rotulo = 'Carregando' }: { rotulo?: string }) => (
  <div role="status" aria-busy="true" aria-label={rotulo} className="grid gap-4">
    <Skeleton className="h-10" />
    <Skeleton className="h-10" />
    <Skeleton className="h-10" />
    <Skeleton className="h-24" />
  </div>
);

/** Painel de "Nova extensão", "Editar extensão" e "Pedir de novo" (?base=<id>). */
export function PainelPedido() {
  const { aba = 'meus', id } = useParams();
  const [params] = useSearchParams();
  const editando = id !== undefined;
  const baseId = editando ? undefined : params.get('base') ?? undefined;
  const { fechar, concluir } = useFecharPainel(aba);
  const avisar = useAvisar();
  const titulo = editando ? 'Editar extensão' : 'Nova extensão';

  const permissoes = usePermissoes();
  const justificativas = useJustificativas();
  const colaboradores = useColaboradores(permissoes.data?.podePedirParaOutros ?? false);
  const alvo = usePedido(id ?? baseId);

  const falhaAoCarregar = (erro: unknown, tentar: () => void) => (
    <PainelMensagem titulo={titulo} aoFechar={fechar} aoTentar={erro instanceof ApiError && (erro.status === 403 || erro.status === 404) ? undefined : tentar}>
      <p role="alert" className="text-sm text-foreground">{mensagemParaUsuario(erro, 'carregar')}</p>
    </PainelMensagem>
  );

  if (permissoes.isError) return falhaAoCarregar(permissoes.error, () => void permissoes.refetch());
  if (justificativas.isError) return falhaAoCarregar(justificativas.error, () => void justificativas.refetch());
  if (editando && alvo.isError) return falhaAoCarregar(alvo.error, () => void alvo.refetch());
  if (permissoes.isPending || justificativas.isPending || alvo.isLoading) {
    return <PainelMensagem titulo={titulo} aoFechar={fechar}><Carregando /></PainelMensagem>;
  }

  const perm = permissoes.data;
  if (!perm.podePedir) {
    return <PainelMensagem titulo={titulo} aoFechar={fechar}><p role="alert" className="text-sm text-foreground">Você não tem permissão para pedir extensões.</p></PainelMensagem>;
  }

  // Gestor: sem a lista da equipe, "Para outra pessoa" ficaria vazio e sem saída. Melhor avisar e oferecer tentar de novo.
  if (perm.podePedirParaOutros && colaboradores.isPending) {
    return <PainelMensagem titulo={titulo} aoFechar={fechar}><Carregando /></PainelMensagem>;
  }
  if (perm.podePedirParaOutros && colaboradores.isError) {
    return (
      <PainelMensagem titulo={titulo} aoFechar={fechar}>
        <div role="alert" className="grid gap-2 text-sm text-foreground">
          <p>Não conseguimos carregar a sua equipe. Verifique sua conexão e tente de novo.</p>
          <Button variant="secondary" className="w-fit max-md:h-11" onClick={() => void colaboradores.refetch()}>Tentar de novo</Button>
        </div>
      </PainelMensagem>
    );
  }

  const pedido = alvo.data;
  if (editando && pedido) {
    if (pedido.solicitante.id !== perm.usuario.id) {
      return <PainelMensagem titulo={titulo} aoFechar={fechar}><p role="alert" className="text-sm text-foreground">Só quem criou o pedido pode editá-lo.</p></PainelMensagem>;
    }
    if (pedido.status !== 'pendente') {
      return <PainelMensagem titulo={titulo} aoFechar={fechar}><p role="alert" className="text-sm text-foreground">Este pedido não pode mais ser editado.</p></PainelMensagem>;
    }
  }

  // Se o pedido-base não carregar, o formulário abre em branco: pedir de novo é só um atalho.
  const inicial = pedido ? (editando ? formDoPedido(pedido, perm) : formPedirDeNovo(pedido, perm)) : formVazio(perm);
  // Garante que o beneficiário de um pedido existente apareça na lista mesmo que ela não o traga.
  const equipe: Pessoa[] = colaboradores.data ?? [];
  const lista = pedido && inicial.beneficiarioId && !equipe.some((p) => p.id === inicial.beneficiarioId)
    ? [...equipe, pedido.beneficiario]
    : equipe;

  return (
    <FormularioPedido
      key={pedido?.id ?? 'novo'}
      modo={editando ? 'editar' : 'novo'}
      pedidoId={id}
      inicial={inicial}
      permissoes={perm}
      justificativas={justificativas.data}
      colaboradores={lista}
      aoFechar={fechar}
      aoSucesso={(salvo: Pedido) => {
        avisar(textoSucesso(editando ? 'editar' : 'novo', salvo.gestor));
        concluir(!editando);
      }}
    />
  );
}
