import { useEffect, useState } from 'react';

const CONSULTA = '(max-width: 767px)';

/** true no celular (< 768px). Em ambiente sem matchMedia (testes), vale a tela larga. */
export function useTelaEstreita(): boolean {
  const [estreita, setEstreita] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(CONSULTA).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(CONSULTA);
    const aoMudar = () => setEstreita(mq.matches);
    aoMudar();
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);
  return estreita;
}
