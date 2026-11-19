import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CopyIcon, ExternalLinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { sobreApi } from '../api';
import {
  SITE_SUPORTE, formatarData, passouDoLimite, percentualDeUso, resumoParaSuporte, textoDeLicencas, type InfoSistema,
} from '../domain/sobre';

const CARTAO = 'grid content-start gap-3 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]';

// pedir ao @PhLima07: barra de uso (meter) no sistema de design.
function BarraDeUso({ usadas, contratadas }: { usadas: number; contratadas: number }) {
  const texto = textoDeLicencas(usadas, contratadas);
  const alerta = passouDoLimite(usadas, contratadas);
  return (
    <div className="grid gap-2">
      <div
        role="meter"
        aria-label="Licenças em uso"
        aria-valuemin={0}
        aria-valuemax={contratadas}
        aria-valuenow={usadas}
        aria-valuetext={texto}
        className="h-3 overflow-hidden rounded-full border border-[var(--color-line-strong)] bg-card"
      >
        <div
          className={cn('h-full rounded-full', alerta ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-brand)]')}
          style={{ width: `${percentualDeUso(usadas, contratadas)}%` }}
        />
      </div>
      <p className="text-sm text-foreground">{texto}</p>
    </div>
  );
}

function Versao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="text-base font-semibold text-foreground tabular-nums">{valor}</dd>
    </div>
  );
}

function Conteudo({ info }: { info: InfoSistema }) {
  const alerta = passouDoLimite(info.licencasUsadas, info.licencasContratadas);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section aria-labelledby="sobre-licencas" className={CARTAO}>
        <h2 id="sobre-licencas" className="text-base font-semibold text-foreground">Licenças</h2>
        <BarraDeUso usadas={info.licencasUsadas} contratadas={info.licencasContratadas} />
        {alerta && (
          <p role="status" className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            <Badge status="warning">Quase no limite</Badge>
            As licenças estão acabando. Fale com o suporte da Scua para contratar mais.
          </p>
        )}
      </section>

      <section aria-labelledby="sobre-versoes" className={CARTAO}>
        <h2 id="sobre-versoes" className="text-base font-semibold text-foreground">Versões</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Versao rotulo="Versão do aplicativo" valor={info.versaoApp} />
          <Versao rotulo="Versão do banco de dados" valor={info.versaoBanco} />
          <Versao rotulo="Última atualização" valor={formatarData(info.atualizadoEm)} />
        </dl>
      </section>

      <section aria-labelledby="sobre-ajuda" className={cn(CARTAO, 'md:col-span-2')}>
        <h2 id="sobre-ajuda" className="text-base font-semibold text-foreground">Precisa de ajuda?</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fale com o suporte da Scua. Se for abrir um chamado, use o botão "Copiar informações" no alto da página e cole o resumo na conversa.
        </p>
        <a
          href={SITE_SUPORTE}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'secondary' }), 'justify-self-start max-md:h-11')}
        >
          Falar com o suporte da Scua
          <span className="sr-only"> (abre em nova aba)</span>
          <ExternalLinkIcon aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}

function Carregando() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-32 w-full md:col-span-2" />
    </div>
  );
}

export function SobrePage() {
  const toast = useToast();
  const consulta = useQuery({ queryKey: ['sobre'], queryFn: () => sobreApi.obter() });
  // Quando a área de transferência não está disponível, o resumo aparece num campo para copiar na mão.
  const [manual, setManual] = useState<string | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  const copiar = async () => {
    if (!consulta.data) return;
    const texto = resumoParaSuporte(consulta.data);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Área de transferência indisponível');
      await navigator.clipboard.writeText(texto);
      setManual(null);
      toast.success('Informações copiadas. Cole no seu chamado.');
    } catch (erro) {
      console.error(erro);
      setManual(texto);
      toast.error('Não conseguimos copiar sozinhos. Selecione o texto abaixo e copie.');
      window.setTimeout(() => campo.current?.select(), 0);
    }
  };

  let conteudo;
  if (consulta.isPending) conteudo = <Carregando />;
  else if (consulta.isError) conteudo = <EstadoErro erro={consulta.error} aoTentar={() => void consulta.refetch()} />;
  else conteudo = <Conteudo info={consulta.data} />;

  return (
    <Pagina
      titulo="Sobre"
      descricao="Informações do sistema, só para leitura."
      acoes={(
        <Button variant="secondary" disabled={!consulta.data} onClick={() => void copiar()}>
          <CopyIcon aria-hidden="true" />
          Copiar informações
        </Button>
      )}
    >
      {conteudo}
      {manual !== null && (
        <div className="grid gap-2">
          <label htmlFor="sobre-resumo" className="text-sm font-semibold text-foreground">Resumo para copiar</label>
          <textarea
            id="sobre-resumo"
            ref={campo}
            readOnly
            rows={6}
            value={manual}
            className="w-full rounded-md border border-input bg-card p-3 font-mono text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
          />
        </div>
      )}
    </Pagina>
  );
}
