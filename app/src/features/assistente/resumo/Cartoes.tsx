import { Link } from 'react-router';
import { ArrowRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';
import { formatarDuracao } from '../../extensoes/domain/horas';
import { useAssistente, type MensagemDaConversa } from '../estado';
import { ROTULO_DA_GRAVIDADE, type Gravidade } from './resumoDoDia';

const STATUS_DA_GRAVIDADE: Record<Gravidade, 'danger' | 'warning' | 'neutral'> = { alta: 'danger', media: 'warning', baixa: 'neutral' };
const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

/** No celular a janela cobre a tela inteira: ao abrir outra tela, ela se fecha para a tela aparecer. */
const fecharNoCelular = (fechar: () => void) => {
  if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches) fechar();
};

/** O que vem depois do texto de uma mensagem: os itens do resumo, o cartão de confirmação ou um atalho para a tela. */
export function CartaoDaMensagem({ mensagem }: { mensagem: MensagemDaConversa }) {
  const a = useAssistente();
  const c = mensagem.cartao;
  if (!c) return null;

  if (c.tipo === 'resumo') {
    return (
      <ul aria-label="O que precisa de você hoje" className="grid gap-2">
        {c.itens.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={a.pensando}
              onClick={() => void a.tratarItem(item)}
              className="grid w-full gap-1 rounded-md border border-[var(--color-line-strong)] bg-card px-3 py-2 text-left text-sm text-foreground outline-none hover:border-foreground focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60 max-md:min-h-11"
            >
              <span className="font-semibold">{item.titulo}</span>
              <span><Badge status={STATUS_DA_GRAVIDADE[item.gravidade]}>{ROTULO_DA_GRAVIDADE[item.gravidade]}</Badge></span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  if (c.tipo === 'abrir') {
    return (
      <Link to={c.rota} onClick={() => fecharNoCelular(a.fechar)} className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit max-md:h-11')}>
        {c.rotulo}<ArrowRightIcon aria-hidden="true" />
      </Link>
    );
  }

  // Cartão de confirmação da aprovação em lote.
  const n = c.dentro.length;
  const total = c.dentro.reduce((s, p) => s + p.minutos, 0);
  const aberto = c.estado === 'aguardando' || c.estado === 'enviando';
  return (
    <section aria-label="Confirmar aprovação em lote" className="grid gap-3 rounded-md border border-[var(--color-line-strong)] bg-card p-3 text-sm text-foreground">
      <div className="grid gap-1">
        <p className="font-semibold">{`${n} ${plural(n, 'pedido', 'pedidos')} · ${formatarDuracao(total)} no total`}</p>
        <ul className="grid list-disc gap-1 pl-5">
          {c.dentro.map((p) => <li key={p.id}>{`${p.nome}: ${formatarDuracao(p.minutos)} (${p.periodo})`}</li>)}
        </ul>
      </div>
      {c.fora.length > 0 && (
        <div className="grid gap-1 rounded-md bg-[var(--color-warning-bg)] p-2 text-[var(--color-warning-text)]">
          <p className="font-semibold">{`Ficam de fora ${c.fora.length} ${plural(c.fora.length, 'pedido', 'pedidos')}, que você decide na tela de pedidos:`}</p>
          <ul className="grid list-disc gap-1 pl-5">
            {c.fora.map((p) => <li key={p.id}>{`${p.nome}: ${p.motivoFora}`}</li>)}
          </ul>
        </div>
      )}
      {aberto ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="max-md:h-11 max-md:flex-1" loading={c.estado === 'enviando'} onClick={() => void a.confirmarLote(mensagem.id)}>
            {`Aprovar ${n} ${plural(n, 'pedido', 'pedidos')}`}
          </Button>
          <Button type="button" variant="secondary" className="max-md:h-11 max-md:flex-1" disabled={c.estado === 'enviando'} onClick={() => a.cancelarLote(mensagem.id)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground">
          {c.estado === 'concluido' ? 'Aprovação enviada.' : c.estado === 'cancelado' ? 'Cancelado.' : 'Esta lista foi substituída por uma mais nova.'}
        </p>
      )}
    </section>
  );
}
