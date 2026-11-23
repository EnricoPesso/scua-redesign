import { useEffect, useId, useRef, useState } from 'react';
import { ClipboardListIcon, XIcon } from 'lucide-react';
import { useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { BlocoResumoDoDia } from '../features/inicio/BlocoResumoDoDia';
import { useResumoDoDia } from '../features/assistente/resumo/useResumoDoDia';

/**
 * "Resumo do dia" no cabeçalho, ao lado do modo claro/escuro: um botão com contador que abre uma caixa
 * com o que precisa de quem está logado. Fica disponível em todas as telas sem ocupar o Início.
 * Fecha com Esc, com um clique fora, ao escolher um item e ao trocar de tela.
 */
export function ResumoNoCabecalho() {
  const { resumo } = useResumoDoDia();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const idPainel = useId();
  const local = useLocation();
  const quantos = resumo?.itens.length ?? 0;

  // Trocar de tela (inclusive pelo link de um item) fecha a caixa.
  useEffect(() => { setAberto(false); }, [local.pathname, local.search]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAberto(false);
      botao.current?.focus();
    };
    const aoClicar = (e: PointerEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoClicar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoClicar);
    };
  }, [aberto]);

  const nome = quantos === 0 ? 'Resumo do dia' : `Resumo do dia, ${quantos} ${quantos === 1 ? 'item precisa' : 'itens precisam'} de você`;

  return (
    <div ref={caixa} className="relative">
      <Button
        ref={botao}
        variant="ghost"
        size="icon"
        className="relative size-11 lg:size-10"
        aria-label={nome}
        title="Resumo do dia"
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((a) => !a)}
      >
        <ClipboardListIcon aria-hidden="true" />
        {quantos > 0 && (
          <span aria-hidden="true" className="absolute top-0.5 right-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-danger)] px-1 text-xs leading-none font-bold text-[var(--color-on-danger)]">
            {quantos > 9 ? '9+' : quantos}
          </span>
        )}
      </Button>
      <section
        id={idPainel}
        hidden={!aberto}
        aria-label="Resumo do dia"
        className="absolute top-full right-0 z-30 mt-2 grid max-h-[min(32rem,calc(100dvh-5rem))] w-[26rem] gap-3 overflow-y-auto rounded-lg border border-[var(--color-line-strong)] bg-popover p-4 text-popover-foreground shadow-[var(--shadow-3)] max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:mt-0 max-sm:w-auto"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="grid gap-0.5">
            <h2 className="text-base font-bold text-foreground">Resumo do dia</h2>
            <p className="text-sm text-muted-foreground">O que precisa de você hoje</p>
          </div>
          <Button variant="ghost" size="icon" className="size-11 shrink-0 lg:size-9" aria-label="Fechar o resumo do dia" onClick={() => { setAberto(false); botao.current?.focus(); }}>
            <XIcon aria-hidden="true" />
          </Button>
        </div>
        {aberto && <BlocoResumoDoDia compacto aoEscolher={() => setAberto(false)} />}
      </section>
    </div>
  );
}
