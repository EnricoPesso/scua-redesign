import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { Pagina } from '../componentes/Pagina';

/** O navegador não conseguiu baixar o código da tela: quase sempre porque uma versão nova foi publicada. */
const FALHA_AO_BAIXAR_A_TELA = /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i;

interface EstadoDoErro { erroEm: string | null; precisaRecarregar: boolean }

/**
 * Tratamento de erro global: se uma tela quebrar, a pessoa vê um texto amigável e o menu continua funcionando.
 * O sistema atual mostrava "[object ProgressEvent]"; aqui o detalhe técnico vai só para o console.
 * `chave` (o endereço atual): trocar de tela limpa o erro.
 */
export class ErroGlobal extends Component<{ chave: string; children: ReactNode }, EstadoDoErro> {
  state: EstadoDoErro = { erroEm: null, precisaRecarregar: false };

  static getDerivedStateFromError(erro: unknown): EstadoDoErro {
    const texto = erro instanceof Error ? `${erro.name} ${erro.message}` : '';
    return { erroEm: '__pendente__', precisaRecarregar: FALHA_AO_BAIXAR_A_TELA.test(texto) };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[scua] erro inesperado na tela', erro, info.componentStack);
    this.setState({ erroEm: this.props.chave });
  }

  componentDidUpdate(anterior: { chave: string }) {
    if (anterior.chave !== this.props.chave && this.state.erroEm !== null) this.setState({ erroEm: null, precisaRecarregar: false });
  }

  render() {
    if (this.state.erroEm === null) return this.props.children;
    // "Tentar de novo" não resolve quando o código da tela não baixa (o navegador guarda a falha): só recarregando.
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        {this.state.precisaRecarregar ? (
          <ErrorState
            title="O Scua Logon foi atualizado"
            description="Recarregue a página para continuar. O que você já salvou está guardado."
            action={<Button className="max-md:h-11" onClick={() => window.location.reload()}>Recarregar a página</Button>}
          />
        ) : (
          <ErrorState
            title="Esta tela teve um problema"
            description="Não foi culpa sua. Tente abrir de novo. Se continuar, fale com o TI da sua empresa."
            action={<Button className="max-md:h-11" onClick={() => this.setState({ erroEm: null, precisaRecarregar: false })}>Tentar de novo</Button>}
          />
        )}
      </main>
    );
  }
}

/** Endereço que não existe. */
export function NaoEncontrada() {
  return (
    <Pagina titulo="Página não encontrada">
      <EmptyState
        title="Este endereço não existe"
        description="O link pode estar errado ou a tela mudou de lugar. Use o menu ou a busca de telas (Ctrl K)."
        action={<Link to="/" className={cn(buttonVariants(), 'max-md:h-11')}>Ir para o início</Link>}
      />
    </Pagina>
  );
}

/** Tela que existe, mas não para o perfil da pessoa. */
export function SemAcesso() {
  return (
    <Pagina titulo="Sem acesso">
      <EmptyState
        title="Você não tem acesso a esta tela"
        description="Se precisar dela, peça a quem administra o Scua Logon na sua empresa."
        action={<Link to="/" className={cn(buttonVariants(), 'max-md:h-11')}>Ir para o início</Link>}
      />
    </Pagina>
  );
}
