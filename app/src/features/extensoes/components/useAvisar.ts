import { useToast } from '@/components/ui/use-toast';

/** Aviso de sucesso (toast do sistema de design). O `ToastProvider` vem de `Provedores`. */
export function useAvisar(): (texto: string) => void {
  const toast = useToast();
  return toast.success;
}
