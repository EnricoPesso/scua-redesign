import { useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer } from '@/components/ui/drawer';
import { Select } from '@/components/ui/select';
import { RELATORIOS } from '../relatorios/catalogo';
import { inicioApi } from './api';
import { BLOCOS_FIXOS, BLOCOS_PADRAO, idDeRelatorio, infoDoBloco, lerIdRelatorio, mover } from './blocos';

/** Nome do bloco no painel: o título do bloco fixo ou "Relatório: indicador". */
function nomeDoBloco(id: string, indicadores: Record<string, string[]> | undefined): string {
  const rel = lerIdRelatorio(id);
  if (!rel) return infoDoBloco(id)?.titulo ?? id;
  const titulo = RELATORIOS.find((r) => r.slug === rel.slug)?.titulo ?? rel.slug;
  const rotulo = indicadores?.[rel.slug]?.[rel.indice];
  // Indicador com o mesmo nome do relatório (ex.: "Estações"): o nome aparece uma vez só.
  return rotulo && rotulo !== titulo ? `${titulo}: ${rotulo}` : titulo;
}

/**
 * Painel "Personalizar início": ligar e desligar blocos, mudar a ordem (botões subir/descer, que funcionam pelo teclado)
 * e acrescentar qualquer indicador de qualquer relatório.
 */
export function PersonalizarInicio({ atuais, permitido, aoSalvar, aoFechar }: {
  atuais: string[];
  permitido: (id: string) => boolean;
  aoSalvar: (ids: string[]) => void;
  aoFechar: () => void;
}) {
  const [ligados, setLigados] = useState<string[]>(atuais);
  const [relatorio, setRelatorio] = useState('');
  const [indicador, setIndicador] = useState('');
  const indicadores = useQuery({ queryKey: ['inicio', 'indicadores-dos-relatorios'], queryFn: inicioApi.indicadoresDosRelatorios, staleTime: Infinity });

  const desligados = BLOCOS_FIXOS.filter((b) => permitido(b.id) && !ligados.includes(b.id));
  // Foco pelo teclado: depois de ligar, desligar, mover ou adicionar, o item some ou muda de lugar.
  // O foco vai para um alvo previsível e a mudança é anunciada para leitor de tela.
  const raiz = useRef<HTMLDivElement>(null);
  const [foco, setFoco] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  useLayoutEffect(() => {
    if (!foco) return;
    raiz.current?.querySelector<HTMLElement>(foco)?.focus();
    setFoco(null);
  }, [foco]);
  const caixa = (lista: 'ligados' | 'outros', id: string) => `[data-lista="${lista}"] [data-bloco="${id}"] [role="checkbox"]`;
  const TITULO = '#blocos-ligados';

  const desligar = (id: string) => {
    const i = ligados.indexOf(id);
    const vizinho = ligados[i + 1] ?? ligados[i - 1];
    setLigados((l) => l.filter((x) => x !== id));
    setFoco(vizinho ? caixa('ligados', vizinho) : TITULO);
    setAviso(`${nomeDoBloco(id, indicadores.data)} saiu do seu início.`);
  };
  const ligar = (id: string) => {
    const j = desligados.findIndex((b) => b.id === id);
    const vizinho = desligados[j + 1] ?? desligados[j - 1];
    setLigados((l) => [...l, id]);
    setFoco(vizinho ? caixa('outros', vizinho.id) : TITULO);
    setAviso(`${nomeDoBloco(id, indicadores.data)} entrou no fim do seu início.`);
  };
  const moverBloco = (id: string, delta: -1 | 1) => {
    const novo = mover(ligados, id, delta);
    const pos = novo.indexOf(id);
    const noLimite = delta === -1 ? pos === 0 : pos === novo.length - 1;
    // Mantém o foco no mesmo botão; se ele ficou desabilitado (chegou na ponta), vai para o oposto.
    const acao = (delta === -1) !== noLimite ? 'subir' : 'descer';
    setLigados(novo);
    setFoco(`[data-lista="ligados"] [data-bloco="${id}"] [data-acao="${acao}"]`);
    setAviso(`${nomeDoBloco(id, indicadores.data)} está na posição ${pos + 1} de ${novo.length}.`);
  };
  const opcoesIndicador = relatorio ? (indicadores.data?.[relatorio] ?? []).map((rotulo, i) => ({ value: String(i), label: rotulo })) : [];
  const idNovo = relatorio && indicador !== '' ? idDeRelatorio(relatorio, Number(indicador)) : '';

  return (
    <Drawer
      open
      onOpenChange={(aberto) => { if (!aberto) aoFechar(); }}
      title="Personalizar início"
      description="Escolha os blocos do seu painel e a ordem deles. Vale só para você."
      footer={
        <>
          <Button variant="ghost" className="mr-auto max-md:h-11" onClick={() => { setLigados(BLOCOS_PADRAO.filter(permitido)); setAviso('Blocos do padrão restaurados.'); }}>Restaurar padrão</Button>
          <Button variant="secondary" className="max-md:h-11" onClick={aoFechar}>Cancelar</Button>
          <Button className="max-md:h-11" onClick={() => aoSalvar(ligados)}>Salvar</Button>
        </>
      }
    >
      <div ref={raiz} className="grid gap-6">
        <p role="status" className="sr-only">{aviso}</p>
        <section className="grid gap-2">
          <h3 id="blocos-ligados" tabIndex={-1} className="rounded-sm text-sm font-bold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring">No seu início, nesta ordem</h3>
          {ligados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bloco. Ligue algum abaixo.</p>
          ) : (
            <ul aria-label="Blocos no seu início" data-lista="ligados" className="grid gap-1">
              {ligados.map((id, i) => {
                const nome = nomeDoBloco(id, indicadores.data);
                return (
                  <li key={id} data-bloco={id} className="flex items-center gap-1 rounded-md border border-[var(--color-line)] bg-card px-2">
                    <Checkbox label={nome} checked onCheckedChange={(c) => { if (!c) desligar(id); }} className="min-h-11 flex-1 md:min-h-10" />
                    <Button variant="ghost" size="icon" aria-label={`Subir ${nome}`} data-acao="subir" disabled={i === 0} onClick={() => moverBloco(id, -1)}>
                      <ArrowUpIcon aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Descer ${nome}`} data-acao="descer" disabled={i === ligados.length - 1} onClick={() => moverBloco(id, 1)}>
                      <ArrowDownIcon aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {desligados.length > 0 && (
          <section className="grid gap-2">
            <h3 className="text-sm font-bold text-foreground">Outros blocos</h3>
            <ul aria-label="Outros blocos" data-lista="outros" className="grid gap-1">
              {desligados.map((b) => (
                <li key={b.id} data-bloco={b.id} className="grid gap-0.5 rounded-md px-2 py-1">
                  <Checkbox label={b.titulo} checked={false} onCheckedChange={(c) => { if (c) ligar(b.id); }} className="min-h-11 md:min-h-10" />
                  <p className="pl-7 text-xs text-muted-foreground">{b.descricao}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="grid gap-3 rounded-lg border border-[var(--color-line)] p-4">
          <h3 className="text-sm font-bold text-foreground">Adicionar indicador de relatório</h3>
          <p className="text-xs text-muted-foreground">Qualquer número dos relatórios pode ficar no seu início. Ele segue o período escolhido lá em cima.</p>
          <Select
            label="Relatório"
            placeholder="Escolha o relatório"
            options={RELATORIOS.map((r) => ({ value: r.slug, label: r.titulo }))}
            value={relatorio || null}
            onValueChange={(v) => { setRelatorio(v ?? ''); setIndicador(''); }}
            className="max-md:[&_[role=combobox]]:h-11"
          />
          <Select
            label="Indicador"
            placeholder={indicadores.isPending ? 'Carregando…' : 'Escolha o indicador'}
            options={opcoesIndicador}
            value={indicador || null}
            disabled={!relatorio || opcoesIndicador.length === 0}
            onValueChange={(v) => setIndicador(v ?? '')}
            className="max-md:[&_[role=combobox]]:h-11"
          />
          <Button
            variant="secondary"
            className="w-fit max-md:h-11 max-md:w-full"
            disabled={!idNovo || ligados.includes(idNovo)}
            onClick={() => {
              setLigados((l) => [...l, idNovo]);
              setIndicador('');
              setFoco(caixa('ligados', idNovo));
              setAviso(`${nomeDoBloco(idNovo, indicadores.data)} entrou no fim do seu início.`);
            }}
          >
            {idNovo && ligados.includes(idNovo) ? 'Já está no seu início' : 'Adicionar indicador'}
          </Button>
        </section>
      </div>
    </Drawer>
  );
}
