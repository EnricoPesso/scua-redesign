import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { useAssistente } from './estado';
import { CartaoDaMensagem } from './resumo/Cartoes';

export const AVISO = 'Respostas geradas por IA. Confira antes de salvar. O conteúdo da conversa e os dados da tela aberta são enviados ao provedor de IA configurado.';

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
  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(texto); }
  };

  const sugestoes = a.tipoDoAlvo === 'relatorio'
    ? ['Analisar este relatório', 'Como aprovo uma extensão?']
    : a.tipoDoAlvo === 'formulario' ? [] : ['O que precisa de mim hoje?', 'Como aprovo uma extensão?', 'Abrir Ausências de ontem'];
  // A abertura do dia é do app: as sugestões somem só quando a pessoa começa a conversar.
  const comecou = a.conversa.some((m) => !m.local);
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
        {a.conversa.map((m) => {
          const texto = (
            <p
              className={cn(
                'rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap',
                !m.cartao && 'max-w-[88%]',
                m.papel === 'usuario' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-[var(--color-surface-muted)] text-foreground',
                m.erro && 'border border-[var(--color-danger)]',
              )}
            >
              <span className="sr-only">{m.papel === 'usuario' ? 'Você: ' : 'Assistente: '}</span>
              {m.texto}
            </p>
          );
          if (!m.cartao) return <div key={m.id} className="contents">{texto}</div>;
          return (
            <div key={m.id} className="flex w-full max-w-[96%] flex-col items-start gap-2 self-start">
              {texto}
              <div className="w-full"><CartaoDaMensagem mensagem={m} /></div>
            </div>
          );
        })}
        {a.conversa.length > 0 && <div ref={fim} aria-hidden="true" />}
      </div>

      {a.pensando && <p role="status" className="text-sm text-muted-foreground">Pensando…</p>}
      {ultima?.erro && !a.pensando && (
        <Button type="button" variant="secondary" className="w-fit max-md:h-11" onClick={() => void a.tentarDeNovo()}>Tentar de novo</Button>
      )}

      {!comecou && !a.pensando && sugestoes.length > 0 && (
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

      {/* Não é um <form>: a conversa também aparece dentro dos formulários, e um formulário dentro de outro
          é inválido (o envio da mensagem acabaria enviando o formulário de fora). */}
      <div role="group" aria-label="Enviar mensagem" className="flex items-end gap-2">
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
        <Button type="button" size="icon" aria-label="Enviar" disabled={!texto.trim() || a.pensando} onClick={() => enviar(texto)} className="max-md:size-11">
          <SendIcon aria-hidden="true" />
        </Button>
      </div>

      {a.podeAutomatica && (
        <div className="grid gap-0.5 border-t border-[var(--color-line)] pt-2">
          <Toggle label="Aprovação automática" checked={a.automatica} onCheckedChange={a.definirAutomatica} className="max-md:min-h-11" />
          <p className="text-xs text-muted-foreground">O assistente salva sozinho depois de preencher. Nunca exclui nada.</p>
        </div>
      )}
    </div>
  );
}
