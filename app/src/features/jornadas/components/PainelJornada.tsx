import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { mensagemDeErro } from '../../../lib/mensagens';
import { Carregando, useFecharPainel, useJornadas } from './apoio';
import { FormularioJornada } from './FormularioJornada';

function PainelMensagem({ titulo, aoFechar, aoTentar, children }: { titulo: string; aoFechar: () => void; aoTentar?: () => void; children: ReactNode }) {
  return (
    <Drawer
      open
      onOpenChange={(a) => { if (!a) aoFechar(); }}
      title={titulo}
      footer={
        <>
          {aoTentar && <Button variant="secondary" className="max-md:h-11" onClick={aoTentar}>Tentar de novo</Button>}
          <Button className="max-md:h-11" onClick={aoFechar}>Voltar</Button>
        </>
      }
    >
      {children}
    </Drawer>
  );
}

/** Painel de `/jornadas/nova` e `/jornadas/:id`. */
export function PainelJornada() {
  const { id } = useParams();
  const fechar = useFecharPainel();
  const lista = useJornadas();
  const titulo = id ? 'Editar jornada' : 'Nova jornada';

  if (lista.isError) {
    return <PainelMensagem titulo={titulo} aoFechar={fechar} aoTentar={() => void lista.refetch()}><p role="alert" className="text-sm text-foreground">{mensagemDeErro(lista.error, 'carregar')}</p></PainelMensagem>;
  }
  if (lista.isPending) return <PainelMensagem titulo={titulo} aoFechar={fechar}><Carregando rotulo="Carregando jornada" /></PainelMensagem>;

  const atual = id ? lista.data.find((j) => j.id === id) : undefined;
  if (id && !atual) {
    return <PainelMensagem titulo={titulo} aoFechar={fechar}><p role="alert" className="text-sm text-foreground">Esta jornada não existe ou foi removida.</p></PainelMensagem>;
  }
  return <FormularioJornada key={atual?.id ?? 'nova'} atual={atual} todas={lista.data} aoFechar={fechar} />;
}
