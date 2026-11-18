import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DownloadIcon, UploadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { importarCarga } from '../api';
import { baixarTexto, lerArquivo } from '../arquivo';
import { gerarModelo, type DefinicaoCarga } from '../domain/cargas';
import { listaDeProblemas, resumoDaImportacao, resumoDaPrevia } from '../domain/textos';
import { validarArquivo, type LinhaDeCarga, type ProblemaLinha } from '../domain/validacao';

type Estado =
  | { tipo: 'vazio' }
  | { tipo: 'lendo' }
  | { tipo: 'invalido'; arquivo: string; erro: string }
  | { tipo: 'previa'; arquivo: string; validas: LinhaDeCarga[]; problemas: ProblemaLinha[]; falhou: boolean };

const AVISO = 'rounded-md p-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring';

/** Um cartão por carga: baixar o modelo, escolher o arquivo, conferir a prévia e importar. */
export function CartaoCarga({ carga }: { carga: DefinicaoCarga }) {
  const idTitulo = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const aviso = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const client = useQueryClient();
  const [estado, setEstado] = useState<Estado>({ tipo: 'vazio' });
  const [ultima, setUltima] = useState<string | null>(null);

  const importar = useMutation({
    mutationFn: ({ arquivo, validas, ignoradas }: { arquivo: string; validas: LinhaDeCarga[]; ignoradas: number }) =>
      importarCarga(carga, arquivo, validas, ignoradas),
    onSuccess: (registro) => {
      setUltima(resumoDaImportacao(registro.importadas, registro.ignoradas, registro.quando));
      setEstado({ tipo: 'vazio' });
      toast.success(`${carga.nome}: ${registro.importadas} ${registro.importadas === 1 ? 'linha importada' : 'linhas importadas'}.`);
      void client.invalidateQueries({ queryKey: ['carga', 'historico'] });
    },
    onError: (erro) => {
      console.error(erro);
      setEstado((e) => (e.tipo === 'previa' ? { ...e, falhou: true } : e));
    },
  });

  // Depois de escolher o arquivo ou de uma falha, o foco vai para o aviso (quem usa teclado ou leitor de tela percebe a mudança).
  const chave = estado.tipo === 'previa' ? `previa-${estado.falhou}` : estado.tipo;
  useEffect(() => {
    if (chave.startsWith('previa') || chave === 'invalido' || ultima) aviso.current?.focus();
  }, [chave, ultima]);

  async function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois de corrigi-lo
    if (!arquivo) return;
    setUltima(null);
    importar.reset();
    setEstado({ tipo: 'lendo' });
    try {
      const texto = await lerArquivo(arquivo);
      const r = validarArquivo({ nome: arquivo.name, tamanho: arquivo.size, texto }, carga);
      setEstado(r.ok
        ? { tipo: 'previa', arquivo: arquivo.name, validas: r.validas, problemas: r.problemas, falhou: false }
        : { tipo: 'invalido', arquivo: arquivo.name, erro: r.erro });
    } catch (erro) {
      console.error(erro);
      setEstado({ tipo: 'invalido', arquivo: arquivo.name, erro: 'Não conseguimos ler o arquivo. Tente salvar de novo como CSV e envie outra vez.' });
    }
  }

  function escolher() {
    entrada.current?.click();
  }
  function baixarModelo() {
    baixarTexto(carga.arquivoModelo, gerarModelo(carga));
  }

  const previa = estado.tipo === 'previa' ? estado : null;
  const { itens, restantes } = previa ? listaDeProblemas(previa.problemas) : { itens: [], restantes: 0 };
  const prontas = previa?.validas.length ?? 0;
  const botao = 'max-md:h-11 max-md:flex-1';

  return (
    <section aria-labelledby={idTitulo} className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5">
      <header className="flex flex-col gap-1">
        <h2 id={idTitulo} className="font-heading text-base font-bold text-foreground">{carga.nome}</h2>
        <p className="text-sm text-muted-foreground">{carga.descricao}</p>
      </header>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-foreground">Colunas do arquivo, nesta ordem</p>
        <ul className="flex flex-wrap gap-1.5">
          {carga.colunas.map((c) => (
            <li key={c.nome} className="rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-xs text-foreground">{c.nome}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className={botao} aria-label={`Baixar modelo de ${carga.nome}`} onClick={baixarModelo}>
          <DownloadIcon aria-hidden="true" />Baixar modelo
        </Button>
        <Button type="button" className={botao} aria-label={`Enviar arquivo de ${carga.nome}`} disabled={importar.isPending} loading={estado.tipo === 'lendo'} onClick={escolher}>
          <UploadIcon aria-hidden="true" />Enviar arquivo
        </Button>
        <input
          ref={entrada}
          type="file"
          accept=".csv,text/csv"
          aria-label={`Arquivo CSV de ${carga.nome}`}
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => void aoEscolher(e)}
        />
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {ultima && (
          <p ref={aviso} role="status" tabIndex={-1} className={`${AVISO} bg-[var(--color-success-bg)] font-semibold text-[var(--color-success-text)]`}>{ultima}</p>
        )}

        {estado.tipo === 'invalido' && (
          <div ref={aviso} role="alert" tabIndex={-1} className={`${AVISO} grid gap-1 bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]`}>
            <p className="font-semibold">Não dá para usar {estado.arquivo}</p>
            <p>{estado.erro}</p>
          </div>
        )}

        {previa && (
          <div className="flex flex-col gap-3">
            <div ref={aviso} role={previa.falhou ? 'alert' : 'status'} tabIndex={-1} className={`${AVISO} grid gap-1 ${previa.falhou ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]' : prontas > 0 ? 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]' : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'}`}>
              <p className="font-semibold break-all">{previa.arquivo}</p>
              {previa.falhou ? (
                <p className="font-semibold">Não conseguimos importar. Nada foi alterado.</p>
              ) : (
                <p className="font-semibold">{resumoDaPrevia(prontas, previa.problemas.length)}</p>
              )}
            </div>

            {itens.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-foreground">Estas linhas não serão importadas</p>
                <ul className="grid gap-1 text-sm text-foreground">
                  {itens.map((t) => <li key={t} className="break-words">{t}</li>)}
                </ul>
                {restantes > 0 && <p className="text-sm text-muted-foreground">e mais {restantes}</p>}
                <p className="text-xs text-muted-foreground">Corrija essas linhas no arquivo e envie de novo, ou importe só as prontas.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className={botao}
                disabled={prontas === 0}
                loading={importar.isPending}
                onClick={() => importar.mutate({ arquivo: previa.arquivo, validas: previa.validas, ignoradas: previa.problemas.length })}
              >
                {previa.falhou ? 'Tentar de novo' : `Importar ${prontas} ${prontas === 1 ? 'linha' : 'linhas'}`}
              </Button>
              <Button type="button" variant="secondary" className={botao} disabled={importar.isPending} onClick={() => { setEstado({ tipo: 'vazio' }); importar.reset(); escolher(); }}>
                Escolher outro arquivo
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
