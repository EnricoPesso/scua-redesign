import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { useAssistente } from './estado';

const AVISO = 'Respostas geradas por IA. Confira antes de salvar. O conteúdo da conversa e os dados da tela aberta são enviados ao provedor de IA configurado.';

/**
 * A conversa com o assistente: avisos, histórico, sugestões e campo de mensagem.
 * É a mesma na janela flutuante e dentro dos formulários. As respostas são mostradas como texto puro.
 */
export function Conversa({ focarAoAbrir = false, exemplo, className }: { focarAoAbrir?: boolean; exemplo?: string; className?: string }) {
  const a = useAssistente();
  const [texto, setTexto] = useState('');
  const campo = useRef<HTMLTextAreaElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const idCampo = useId();
  const idDica = useId();

  useEffect(() => {
    if (focarAoAbrir) campo.current?.focus();
  }, [focarAoAbrir]);

  // Mensagem nova: rola o histórico até o fim.
  useEffect(() => {
    fim.current?.scrollIntoView?.({ block: 'end' });
  }, [a.conversa.length, a.pensando]);

  const enviar = (mensagem: string) => {
    if (!mensagem.trim() || a.pensando) return;
    setTexto('');
    void a.enviar(mensagem);
  };
  const aoEnviar = (e: FormEvent) => { e.preventDefault(); enviar(texto); };
  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(texto); }
  };

  const sugestoes = a.tipoDoAlvo === 'relatorio'
    ? ['Analisar este relatório', 'Como aprovo uma extensão?']
    : a.tipoDoAlvo === 'formulario' ? [] : ['Como aprovo uma extensão?', 'Abrir Ausências de ontem'];
  const ultima = a.conversa.at(-1);

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <p className="text-xs text-muted-foreground">{AVISO}</p>
      {a.simulado && (
        <p className="w-fit rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-foreground">
          Modo demonstração (sem IA conectada)
        </p>
      )}

      <div role="log" aria-live="polite" aria-label="Conversa com o assistente" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
        {a.conversa.map((m, i) => (
          <p
            key={i}
            className={cn(
              'max-w-[88%] rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap',
              m.papel === 'usuario' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-[var(--color-surface-muted)] text-foreground',
              m.erro && 'border border-[var(--color-danger)]',
            )}
          >
            <span className="sr-only">{m.papel === 'usuario' ? 'Você: ' : 'Assistente: '}</span>
            {m.texto}
          </p>
        ))}
        {a.conversa.length > 0 && <div ref={fim} aria-hidden="true" />}
      </div>

      {a.pensando && <p role="status" className="text-sm text-muted-foreground">Pensando…</p>}
      {ultima?.erro && !a.pensando && (
        <Button variant="secondary" className="w-fit" onClick={() => void a.tentarDeNovo()}>Tentar de novo</Button>
      )}

      {a.conversa.length === 0 && !a.pensando && sugestoes.length > 0 && (
        <ul aria-label="Sugestões" className="flex flex-wrap gap-2">
          {sugestoes.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => enviar(s)}
                className="rounded-full border border-input bg-card px-3 py-1.5 text-sm text-foreground outline-none hover:border-foreground focus-visible:ring-3 focus-visible:ring-ring"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={aoEnviar} className="flex items-end gap-2">
        <div className="grid min-w-0 flex-1 gap-1">
          <label htmlFor={idCampo} className="sr-only">Mensagem para o assistente</label>
          <textarea
            id={idCampo}
            ref={campo}
            rows={2}
            value={texto}
            maxLength={2000}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder={exemplo ?? 'Pergunte ou peça algo…'}
            aria-describedby={idDica}
            className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring"
          />
          <span id={idDica} className="sr-only">Enter envia. Shift e Enter quebram a linha.</span>
        </div>
        <Button type="submit" size="icon" aria-label="Enviar" disabled={!texto.trim() || a.pensando} className="max-md:size-11">
          <SendIcon aria-hidden="true" />
        </Button>
      </form>

      {a.podeAutomatica && (
        <div className="grid gap-0.5 border-t border-[var(--color-line)] pt-2">
          <Toggle label="Aprovação automática" checked={a.automatica} onCheckedChange={a.definirAutomatica} />
          <p className="text-xs text-muted-foreground">O assistente salva sozinho depois de preencher. Nunca exclui nada.</p>
        </div>
      )}
    </div>
  );
}
