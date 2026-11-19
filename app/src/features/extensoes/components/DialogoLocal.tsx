import { useEffect, useId, useRef, type ReactNode } from 'react';

// pedir ao @PhLima07: diálogo com conteúdo livre (o ConfirmDialog só aceita descrição em texto, e a
// confirmação do lote precisa de lista de nomes, rádios e resultado). Usa <dialog> nativo: Esc, foco
// preso e fundo inerte vêm do navegador.
export function DialogoLocal({ titulo, aberto, aoFechar, children, rodape }: {
  titulo: string;
  aberto: boolean;
  aoFechar: () => void;
  children: ReactNode;
  rodape: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(e) => { e.preventDefault(); aoFechar(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-[var(--shadow-3)] backdrop:bg-[var(--color-backdrop)]"
    >
      {aberto && (
        <div className="grid gap-4">
          <h2 id={idTitulo} className="text-lg font-bold break-words text-foreground">{titulo}</h2>
          <div className="grid gap-3 text-sm text-foreground">{children}</div>
          <div className="flex flex-wrap justify-end gap-2">{rodape}</div>
        </div>
      )}
    </dialog>
  );
}
