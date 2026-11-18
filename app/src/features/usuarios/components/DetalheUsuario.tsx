import { useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Drawer } from '@/components/ui/drawer';
import { Abas } from '../../../componentes/Abas';
import { mensagemDeErro } from '../../../lib/mensagens';
import { ABAS, ROTULO_ABA, ehAba, type Aba } from '../domain/tipos';
import { AbaDados } from './AbaDados';
import { AbaExcecoes } from './AbaExcecoes';
import { AbaFerias } from './AbaFerias';
import { AbaFeriados } from './AbaFeriados';
import { AbaSubstituto } from './AbaSubstituto';
import { Carregando, ID_FORM_ABA, useUsuario, type PropsAba } from './apoio';

const ABAS_DEF = ABAS.map((a) => ({ valor: a, rotulo: ROTULO_ABA[a] }));
const COM_SALVAR: Aba[] = ['dados', 'feriados', 'substituto'];
const CORPO: Record<Aba, (p: PropsAba) => ReactNode> = {
  dados: (p) => <AbaDados {...p} />,
  feriados: (p) => <AbaFeriados {...p} />,
  substituto: (p) => <AbaSubstituto {...p} />,
  excecoes: (p) => <AbaExcecoes {...p} />,
  ferias: (p) => <AbaFerias {...p} />,
};
const LARGURA = 'md:max-w-2xl';

/** Painel lateral de `/usuarios/:id/:aba?`. A lista e os filtros da URL continuam por baixo. */
export function DetalheUsuario() {
  const { id = '', aba } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const usuario = useUsuario(id);
  // Quem abriu o painel (o link da linha) recebe o foco de volta ao fechar.
  const [gatilho] = useState(() => document.activeElement as HTMLElement | null);
  const [sujo, setSujo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pendente, setPendente] = useState<(() => void) | null>(null);

  if (aba !== undefined && !ehAba(aba)) return <Navigate to={{ pathname: `/usuarios/${id}`, search }} replace />;
  const ativa: Aba = aba ?? 'dados';

  const fecharAgora = () => {
    void navigate({ pathname: '/usuarios', search });
    setTimeout(() => {
      if (gatilho && gatilho !== document.body && gatilho.isConnected) gatilho.focus();
      else document.querySelector<HTMLElement>(`a[href^="/usuarios/${id}"]`)?.focus();
    }, 0);
  };
  const irParaAba = (valor: Aba) => {
    setSujo(false);
    void navigate({ pathname: valor === 'dados' ? `/usuarios/${id}` : `/usuarios/${id}/${valor}`, search });
  };
  // Com alterações não salvas, pede confirmação antes de sair (fechar ou trocar de aba).
  const sair = (acao: () => void) => {
    if (salvando) return;
    if (sujo) setPendente(() => acao);
    else acao();
  };

  const mensagem = (titulo: string, corpo: ReactNode, aoTentar?: () => void) => (
    <Drawer
      open
      onOpenChange={(a) => { if (!a) fecharAgora(); }}
      title={titulo}
      className={LARGURA}
      footer={
        <>
          {aoTentar && <Button variant="secondary" className="max-md:h-11" onClick={aoTentar}>Tentar de novo</Button>}
          <Button className="max-md:h-11" onClick={fecharAgora}>Voltar</Button>
        </>
      }
    >
      {corpo}
    </Drawer>
  );

  if (usuario.isError) {
    return mensagem('Usuário', <p role="alert" className="text-sm text-foreground">{mensagemDeErro(usuario.error, 'carregar')}</p>, () => void usuario.refetch());
  }
  if (usuario.isPending) return mensagem('Usuário', <Carregando rotulo="Carregando usuário" />);
  if (!usuario.data) return mensagem('Usuário', <p role="alert" className="text-sm text-foreground">Este usuário não existe ou foi removido.</p>);

  const u = usuario.data;
  return (
    <Drawer
      open
      onOpenChange={(a) => { if (!a) sair(fecharAgora); }}
      title={u.nome}
      description={u.ativo ? 'Usuário ativo' : 'Usuário inativo'}
      className={LARGURA}
      footer={
        <>
          <Button type="button" variant="secondary" className="max-md:h-11 max-md:flex-1" onClick={() => sair(fecharAgora)}>Voltar à lista</Button>
          {COM_SALVAR.includes(ativa) && <Button type="submit" form={ID_FORM_ABA} className="max-md:h-11 max-md:flex-1" loading={salvando}>Salvar</Button>}
        </>
      }
    >
      <Abas rotulo="Seções do usuário" abas={ABAS_DEF} ativa={ativa} aoMudar={(v) => { if (v !== ativa) sair(() => irParaAba(v)); }}>
        {/* A chave reinicia o formulário ao trocar de usuário ou de aba. */}
        <div key={`${u.id}-${ativa}`}>{CORPO[ativa]({ usuario: u, aoMudarSujo: setSujo, aoSalvando: setSalvando })}</div>
      </Abas>

      <ConfirmDialog
        open={pendente !== null}
        onOpenChange={(a) => { if (!a) setPendente(null); }}
        title="Descartar as alterações?"
        description="Você mudou dados que ainda não foram salvos. Se sair agora, essas mudanças serão perdidas."
        confirmLabel="Descartar alterações"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={() => {
          const acao = pendente;
          setPendente(null);
          setSujo(false);
          acao?.();
        }}
      />
    </Drawer>
  );
}
