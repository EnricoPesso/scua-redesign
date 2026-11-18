import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { Pagina } from '../componentes/Pagina';

/**
 * Tratamento de erro global: se uma tela quebrar, a pessoa vê um texto amigável e o menu continua funcionando.
 * O sistema atual mostrava "[object ProgressEvent]"; aqui o detalhe técnico vai só para o console.
 * `chave` (o endereço atual): trocar de tela limpa o erro.
 */
export class ErroGlobal extends Component<{ chave: string; children: ReactNode }, { erroEm: string | null }> {
  state = { erroEm: null as string | null };

  static getDerivedStateFromError(): { erroEm: string } {
    return { erroEm: '__pendente__' };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[scua] erro inesperado na tela', erro, info.componentStack);
    this.setState({ erroEm: this.props.chave });
  }

  componentDidUpdate(anterior: { chave: string }) {
    if (anterior.chave !== this.props.chave && this.state.erroEm !== null) this.setState({ erroEm: null });
  }

  render() {
    if (this.state.erroEm === null) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState
          title="Esta tela teve um problema"
          description="Não foi culpa sua. Tente abrir de novo. Se continuar, fale com o TI da sua empresa."
          action={<Button className="max-md:h-11" onClick={() => this.setState({ erroEm: null })}>Tentar de novo</Button>}
        />
      </div>
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
