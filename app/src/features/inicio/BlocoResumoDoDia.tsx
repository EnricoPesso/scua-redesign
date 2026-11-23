import { useId } from 'react';
import { BotIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAssistenteOuNulo } from '../assistente/estado';
import { ROTULO_DA_GRAVIDADE, TUDO_EM_ORDEM, type Gravidade } from '../assistente/resumo/resumoDoDia';
import { useResumoDoDia } from '../assistente/resumo/useResumoDoDia';

const STATUS: Record<Gravidade, 'danger' | 'warning' | 'neutral'> = { alta: 'danger', media: 'warning', baixa: 'neutral' };

/**
 * Lista do "Resumo do dia": o que precisa de quem está logado hoje, do mais importante ao menos.
 * Cada item leva à tela que resolve e, com o assistente ligado, abre a conversa já no assunto.
 * Aparece na caixa do cabeçalho (`compacto`: uma coluna, botões empilhados) e, para quem escolher em Personalizar, como bloco do Início.
 */
export function BlocoResumoDoDia({ compacto = false, aoEscolher }: { compacto?: boolean; /** Chamado quando a pessoa escolhe um item (a caixa do cabeçalho fecha). */ aoEscolher?: () => void } = {}) {
  const { resumo, carregando, erro, tentarDeNovo } = useResumoDoDia();
  const assistente = useAssistenteOuNulo();
  const base = useId();

  if (carregando) {
    return (
      <div role="status" aria-label="Carregando o resumo do dia" className="grid gap-3">
        <Skeleton className="h-6" />
        <Skeleton className="h-6 w-4/5" />
      </div>
    );
  }
  if (erro || !resumo) {
    return (
      <div className="grid justify-items-start gap-3">
        <p role="alert" className="text-sm text-foreground">Não consegui montar o resumo agora.</p>
        <Button variant="secondary" className="max-md:h-11" onClick={tentarDeNovo}>Tentar de novo</Button>
      </div>
    );
  }
  if (resumo.tudoEmOrdem) {
    return <p className="rounded-md border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground">{TUDO_EM_ORDEM}</p>;
  }

  return (
    <ul aria-label="Itens do resumo do dia" className="grid gap-3">
      {resumo.itens.map((item) => (
        <li key={item.id} className={cn('grid gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3', !compacto && 'sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4')}>
          <div className="grid min-w-0 gap-1">
            <p id={`${base}-${item.id}`} className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              {item.titulo}
              <Badge status={STATUS[item.gravidade]}>{ROTULO_DA_GRAVIDADE[item.gravidade]}</Badge>
            </p>
            <p className="text-sm text-muted-foreground">{item.detalhe}</p>
          </div>
          <div className={cn('flex flex-wrap gap-2 max-md:w-full max-md:flex-col', compacto && 'w-full flex-col')}>
            <Link to={item.rota} onClick={aoEscolher} aria-describedby={`${base}-${item.id}`} className={cn(buttonVariants({ variant: 'secondary' }), 'max-md:h-11 max-md:w-full', compacto && 'w-full')}>{item.rotuloDaRota}</Link>
            {assistente?.ativo && (
              <Button className={cn('max-md:h-11 max-md:w-full', compacto && 'w-full')} aria-describedby={`${base}-${item.id}`} onClick={() => { aoEscolher?.(); assistente.resolverItem(item); }}>
                <BotIcon aria-hidden="true" />Resolver com o assistente
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
