import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { mensagemDeErro } from '../lib/mensagens';

/** Falha ao carregar uma tela ou um bloco: texto amigável + "Tentar de novo". O detalhe técnico vai para o console. */
export function EstadoErro({ erro, aoTentar, titulo = 'Não conseguimos carregar os dados' }: { erro: unknown; aoTentar: () => void; titulo?: string }) {
  const texto = mensagemDeErro(erro, 'carregar');
  return (
    <ErrorState
        title={titulo}
        description={texto.replace(/^Não conseguimos carregar os dados\.\s*/, '')}
        action={<Button className="max-md:h-11" onClick={aoTentar}>Tentar de novo</Button>}
    />
  );
}
