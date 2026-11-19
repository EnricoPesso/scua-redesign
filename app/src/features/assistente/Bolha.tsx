import { useEffect, useId, useRef } from 'react';
import { BotIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Conversa } from './Conversa';
import { useAssistente } from './estado';

/**
 * Bolha do assistente no canto inferior direito + janela de conversa.
 * Com um formulário aberto (painel lateral, que prende o foco), a bolha sai de cena
 * e a conversa aparece dentro do formulário (AssistenteNoFormulario).
 */
export function Bolha() {
  const a = useAssistente();
  const bolha = useRef<HTMLButtonElement>(null);
  const estavaAberto = useRef(false);
  const visivel = a.ativo && a.tipoDoAlvo !== 'formulario';

  // Fechou a janela: o foco volta para a bolha.
  useEffect(() => {
    if (estavaAberto.current && !a.aberto) bolha.current?.focus();
    estavaAberto.current = a.aberto;
  }, [a.aberto]);

  if (!visivel) return null;

  return (
    <>
      {a.aberto && (
        <div
          role="dialog"
          aria-label="Assistente Scua"
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); a.fechar(); } }}
          className="fixed right-4 bottom-20 z-40 flex max-h-[min(38rem,calc(100dvh-6rem))] w-96 flex-col gap-3 rounded-xl border border-[var(--color-line-strong)] bg-popover p-4 text-popover-foreground shadow-[var(--shadow-3)] max-md:inset-0 max-md:max-h-none max-md:w-auto max-md:rounded-none max-md:border-0"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><BotIcon aria-hidden="true" className="size-5 text-[var(--color-brand-text)]" />Assistente Scua</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Limpar conversa" title="Limpar conversa" onClick={a.limpar} disabled={a.conversa.length === 0}><Trash2Icon aria-hidden="true" /></Button>
              <Button variant="ghost" size="icon" aria-label="Fechar assistente" title="Fechar" onClick={a.fechar}><XIcon aria-hidden="true" /></Button>
            </div>
          </div>
          <Conversa focarAoAbrir className="flex-1" />
        </div>
      )}
      <button
        ref={bolha}
        type="button"
        data-assistente
        aria-label="Assistente Scua"
        aria-expanded={a.aberto}
        title="Assistente Scua"
        onClick={() => (a.aberto ? a.fechar() : a.abrir())}
        className={`fixed right-4 bottom-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-3)] outline-none transition-transform duration-[var(--dur-fast)] hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${a.aberto ? 'max-md:hidden' : ''}`}
      >
        <BotIcon aria-hidden="true" className="size-7" />
      </button>
    </>
  );
}

/**
 * O assistente dentro de um formulário: botão "Preencher com IA" e, aberto, a conversa logo abaixo.
 * `exemplo` é o texto de exemplo do campo de mensagem (o que a pessoa pode pedir ali).
 */
export function AssistenteNoFormulario({ exemplo }: { exemplo: string }) {
  const a = useAssistente();
  const idPainel = useId();
  if (!a.ativo) return null;
  return (
    <section aria-label="Assistente Scua" className="grid gap-3 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] p-3">
      <Button
        type="button"
        variant="secondary"
        className="w-fit max-md:h-11"
        aria-expanded={a.aberto}
        aria-controls={idPainel}
        onClick={() => (a.aberto ? a.fechar() : a.abrir())}
      >
        <BotIcon aria-hidden="true" />Preencher com IA
      </Button>
      {a.aberto && (
        <div id={idPainel} className="grid gap-2">
          <Conversa focarAoAbrir exemplo={exemplo} className="max-h-80" />
          {a.conversa.length > 0 && <Button type="button" variant="ghost" className="w-fit" onClick={a.limpar}>Limpar conversa</Button>}
        </div>
      )}
    </section>
  );
}
