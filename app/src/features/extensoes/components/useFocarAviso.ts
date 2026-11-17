import { useEffect, useRef } from 'react';

/**
 * Leva o foco (e a rolagem) até um aviso que aparece no topo de um painel rolável, cujos botões ficam no rodapé.
 * Sem isso, no celular a pessoa toca em "Enviar" lá embaixo e o aviso de erro fica escondido lá em cima.
 * Muda `gatilho` sempre que um aviso novo aparece; o elemento precisa de `tabIndex={-1}`.
 */
export function useFocarAviso<T extends HTMLElement>(gatilho: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!gatilho || !ref.current) return;
    ref.current.scrollIntoView({ block: 'nearest' });
    ref.current.focus();
  }, [gatilho]);
  return ref;
}
