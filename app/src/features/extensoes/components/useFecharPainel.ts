import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Fecha o painel voltando para a lista (com os filtros da URL) e devolve o foco a quem o abriu.
 * `idLinha`: se quem abriu não existe mais (ex.: a linha foi clicada fora do link), o foco vai para o link da linha.
 */
export function useFecharPainel(aba: string, idLinha?: string) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [gatilho] = useState(() => document.activeElement as HTMLElement | null);

  const semBase = () => {
    const p = new URLSearchParams(search);
    p.delete('base');
    const texto = p.toString();
    return texto ? `?${texto}` : '';
  };
  const devolverFoco = () => {
    setTimeout(() => {
      if (gatilho && gatilho !== document.body && gatilho.isConnected) {
        gatilho.focus();
        return;
      }
      if (idLinha) document.querySelector<HTMLElement>(`a[href^="/extensoes/${aba}/${idLinha}"]`)?.focus();
    }, 0);
  };
  return {
    /** Cancelar, ✕ ou Esc: mesma aba, mesmos filtros. */
    fechar: () => {
      void navigate({ pathname: `/extensoes/${aba}`, search: semBase() });
      devolverFoco();
    },
    /** Depois de salvar: pedido novo vai para "Meus pedidos" sem filtros, para aparecer na lista. */
    concluir: (novo: boolean) => {
      void navigate(novo ? { pathname: '/extensoes/meus' } : { pathname: `/extensoes/${aba}`, search: semBase() });
      devolverFoco();
    },
  };
}
