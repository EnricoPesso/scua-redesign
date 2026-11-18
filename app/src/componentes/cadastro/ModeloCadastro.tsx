import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { DateField } from '@/components/ui/date-field';
import { Drawer } from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { mensagemDeErro } from '../../lib/mensagens';
import { useTelaEstreita } from '../../lib/useTelaEstreita';
import type { ComId } from '../../mock/colecao';
import { EstadoErro } from '../EstadoErro';
import { Pagina } from '../Pagina';
import type { CampoCadastro, ConfigCadastro, ErrosCadastro } from './tipos';

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Erros de preenchimento: obrigatórios, limites numéricos e as regras próprias do cadastro. */
export function validarCadastro<T extends ComId>(config: Pick<ConfigCadastro<T>, 'campos' | 'validar'>, dados: Omit<T, 'id'>): ErrosCadastro<T> {
  const erros: ErrosCadastro<T> = {};
  const valores = dados as Record<string, unknown>;
  for (const c of config.campos) {
    const v = valores[c.chave];
    if (c.tipo === 'alternar') continue;
    if (c.tipo === 'numero') {
      if (v === '' || v === null || v === undefined || Number.isNaN(v)) {
        if (c.obrigatorio) erros[c.chave] = `Informe ${c.rotulo.toLowerCase()}`;
      } else if (c.minimo !== undefined && Number(v) < c.minimo) erros[c.chave] = `O mínimo é ${c.minimo}`;
      else if (c.maximo !== undefined && Number(v) > c.maximo) erros[c.chave] = `O máximo é ${c.maximo}`;
      continue;
    }
    const texto = typeof v === 'string' ? v.trim() : '';
    if (c.obrigatorio && !texto) erros[c.chave] = c.tipo === 'select' ? `Escolha ${c.rotulo.toLowerCase()}` : `Informe ${c.rotulo.toLowerCase()}`;
    else if ('maximo' in c && c.maximo !== undefined && texto.length > c.maximo) erros[c.chave] = `Use no máximo ${c.maximo} caracteres`;
  }
  return { ...erros, ...config.validar?.(dados) };
}

export function ModeloCadastro<T extends ComId>({ config }: { config: ConfigCadastro<T> }) {
  const { singular, genero } = config;
  const novoRotulo = `Adicionar ${singular}`;
  const chaveCache = useMemo(() => ['cadastro', config.chave], [config.chave]);
  const client = useQueryClient();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState('');
  const [excluindo, setExcluindo] = useState<T | null>(null);
  const estreita = useTelaEstreita();

  const lista = useQuery({ queryKey: chaveCache, queryFn: config.colecao.listar });
  const excluir = useMutation({
    mutationFn: (item: T) => config.colecao.excluir(item.id),
    onSuccess: (_, item) => {
      toast.success(`${maiuscula(singular)} ${config.nomeDe(item)} excluíd${genero}.`);
      setExcluindo(null);
      void client.invalidateQueries({ queryKey: chaveCache });
    },
    onError: (erro) => {
      console.error(erro);
      toast.error(mensagemDeErro(erro, 'excluir'));
      setExcluindo(null);
    },
  });

  // O painel aberto fica na URL (?novo=1 ou ?editar=<id>): dá para mandar o link de um item.
  const editarId = params.get('editar');
  const criando = params.get('novo') === '1' && config.podeCriar !== false;
  const emEdicao = editarId ? lista.data?.find((i) => i.id === editarId) : undefined;
  const semPainel = (p: URLSearchParams) => {
    const n = new URLSearchParams(p);
    n.delete('novo');
    n.delete('editar');
    return n;
  };
  const abrir = (chave: 'novo' | 'editar', valor: string) => setParams((p) => { const n = semPainel(p); n.set(chave, valor); return n; });
  const fechar = () => setParams(semPainel, { replace: true });

  const itens = useMemo(() => {
    const todos = lista.data ?? [];
    const termo = semAcento(busca.trim());
    if (!termo || !config.textoDeBusca) return todos;
    return todos.filter((i) => semAcento(config.textoDeBusca!(i)).includes(termo));
  }, [lista.data, busca, config]);

  const colunas = [
    ...config.colunas,
    {
      key: '__acoes',
      header: 'Ações',
      render: (item: T) => (
        <span className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="max-md:size-11" aria-label={`Editar ${config.nomeDe(item)}`} onClick={() => abrir('editar', item.id)}>
            <PencilIcon aria-hidden="true" />
          </Button>
          {config.podeExcluir !== false && (
            <Button variant="ghost" size="icon" className="max-md:size-11" aria-label={`Excluir ${config.nomeDe(item)}`} onClick={() => setExcluindo(item)}>
              <Trash2Icon aria-hidden="true" />
            </Button>
          )}
        </span>
      ),
    },
  ];

  const total = lista.data?.length ?? 0;
  let corpo;
  if (lista.isError) {
    corpo = <EstadoErro erro={lista.error} aoTentar={() => void lista.refetch()} />;
  } else if (!lista.isPending && total === 0) {
    corpo = (
      <EmptyState
        title={`Nenhum${genero === 'a' ? 'a' : ''} ${singular} cadastrad${genero}`}
        description={config.podeCriar === false ? undefined : `Quando você adicionar, ${genero === 'a' ? 'ela' : 'ele'} aparece aqui.`}
        action={config.podeCriar === false ? undefined : <Button className="max-md:h-11" onClick={() => abrir('novo', '1')}><PlusIcon aria-hidden="true" />{novoRotulo}</Button>}
      />
    );
  } else {
    corpo = (
      <>
        {config.textoDeBusca && (
          <Field
            className="max-w-sm"
            label="Buscar"
            inputProps={{ type: 'search', value: busca, placeholder: `Buscar ${singular}`, onValueChange: (v: string) => setBusca(v), className: 'max-md:h-11' }}
          />
        )}
        {estreita ? (
          <CartoesCadastro
            config={config}
            itens={itens}
            carregando={lista.isPending}
            busca={busca}
            aoLimparBusca={() => setBusca('')}
            aoEditar={(item) => abrir('editar', item.id)}
            aoExcluir={setExcluindo}
          />
        ) : (
        <DataTable
          columns={colunas}
          rows={itens}
          caption={config.titulo}
          pageSize={config.itensPorPagina ?? 10}
          loading={lista.isPending}
          empty={
            <span>
              Nenhum resultado para “{busca}”.{' '}
              <button type="button" className="font-semibold text-[var(--color-brand-text)] underline underline-offset-4" onClick={() => setBusca('')}>Limpar busca</button>
            </span>
          }
        />
        )}
      </>
    );
  }

  return (
    <Pagina
      titulo={config.titulo}
      descricao={config.descricao}
      trilha={config.trilha}
      acoes={config.podeCriar === false || total === 0 ? undefined : <Button onClick={() => abrir('novo', '1')}><PlusIcon aria-hidden="true" />{novoRotulo}</Button>}
    >
      {corpo}

      {(criando || emEdicao) && (
        <FormularioCadastro
          key={emEdicao?.id ?? 'novo'}
          config={config}
          item={emEdicao}
          aoFechar={fechar}
          aoSalvar={(salvo) => {
            toast.success(`${maiuscula(singular)} ${config.nomeDe(salvo)} ${emEdicao ? 'atualizad' : 'adicionad'}${genero}.`);
            void client.invalidateQueries({ queryKey: chaveCache });
            fechar();
          }}
        />
      )}
      {editarId && !emEdicao && lista.isSuccess && (
        <Drawer open onOpenChange={(a) => { if (!a) fechar(); }} title={`Editar ${singular}`} footer={<Button className="max-md:h-11" onClick={fechar}>Voltar</Button>}>
          <p role="alert" className="text-sm text-foreground">{`Est${genero === 'a' ? 'a' : 'e'} ${singular} não existe ou foi removid${genero}.`}</p>
        </Drawer>
      )}

      <ConfirmDialog
        open={excluindo !== null}
        onOpenChange={(a) => { if (!a) setExcluindo(null); }}
        title={excluindo ? `Excluir ${genero} ${singular} ${config.nomeDe(excluindo)}?` : ''}
        description={`Esta ação não pode ser desfeita.${config.avisoAoExcluir ? ` ${config.avisoAoExcluir}` : ''}`}
        confirmLabel="Excluir"
        destructive
        loading={excluir.isPending}
        onConfirm={() => { if (excluindo) excluir.mutate(excluindo); }}
      />
    </Pagina>
  );
}

/**
 * Celular: cada item vira um cartão, com Editar e Excluir sempre à vista
 * (na tabela, as ações ficavam escondidas atrás da rolagem lateral).
 */
function CartoesCadastro<T extends ComId>({ config, itens, carregando, busca, aoLimparBusca, aoEditar, aoExcluir }: {
  config: ConfigCadastro<T>;
  itens: T[];
  carregando: boolean;
  busca: string;
  aoLimparBusca: () => void;
  aoEditar: (item: T) => void;
  aoExcluir: (item: T) => void;
}) {
  const passo = config.itensPorPagina ?? 10;
  const [visiveis, setVisiveis] = useState(passo);
  if (carregando) {
    return (
      <div role="status" aria-label="Carregando" className="grid gap-3">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }
  if (itens.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-input bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum resultado para “{busca}”.{' '}
        <button type="button" className="font-semibold text-[var(--color-brand-text)] underline underline-offset-4" onClick={aoLimparBusca}>Limpar busca</button>
      </p>
    );
  }
  const [principal, ...demais] = config.colunas;
  const valor = (item: T, c: (typeof config.colunas)[number]) => c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? '');
  const mostrados = itens.slice(0, visiveis);
  return (
    <div className="grid gap-3">
      <ul aria-label={config.titulo} className="grid gap-3">
        {mostrados.map((item) => (
          <li key={item.id} className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)]">
            {/* As colunas podem trazer larguras mínimas pensadas para a tabela: no cartão, tudo se ajusta à largura. */}
            <p className="min-w-0 text-base font-semibold break-words text-foreground [&_*]:min-w-0! [&_*]:max-w-full! [&_*]:whitespace-normal!">{valor(item, principal)}</p>
            {demais.length > 0 && (
              <dl className="grid gap-1.5 text-sm">
                {demais.map((c) => (
                  <div key={c.key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
                    <dt className="text-muted-foreground">{c.header}</dt>
                    <dd className="min-w-0 break-words text-foreground [&_*]:min-w-0! [&_*]:max-w-full! [&_*]:whitespace-normal!">{valor(item, c)}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" aria-label={`Editar ${config.nomeDe(item)}`} onClick={() => aoEditar(item)}><PencilIcon aria-hidden="true" />Editar</Button>
              {config.podeExcluir !== false && (
                <Button variant="secondary" className="flex-1" aria-label={`Excluir ${config.nomeDe(item)}`} onClick={() => aoExcluir(item)}><Trash2Icon aria-hidden="true" />Excluir</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Mostrando {mostrados.length} de {itens.length}</p>
      {visiveis < itens.length && <Button variant="secondary" onClick={() => setVisiveis((v) => v + passo)}>Mostrar mais</Button>}
    </div>
  );
}

function FormularioCadastro<T extends ComId>({ config, item, aoFechar, aoSalvar }: {
  config: ConfigCadastro<T>;
  item?: T;
  aoFechar: () => void;
  aoSalvar: (salvo: T) => void;
}) {
  const idForm = useId();
  const area = useRef<HTMLFormElement>(null);
  const refFalha = useRef<HTMLParagraphElement>(null);
  const [dados, setDados] = useState<Record<string, unknown>>(() => {
    if (!item) return config.novo() as Record<string, unknown>;
    const copia: Record<string, unknown> = { ...(item as unknown as Record<string, unknown>) };
    delete copia.id;
    return copia;
  });
  const [erros, setErros] = useState<ErrosCadastro<T>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const titulo = item ? `Editar ${config.singular}` : `Nov${config.genero} ${config.singular}`;

  const salvar = useMutation({
    mutationFn: (d: Omit<T, 'id'>) => (item ? config.colecao.editar(item.id, d) : config.colecao.criar(d)),
    onSuccess: aoSalvar,
    onError: (erro) => {
      console.error(erro);
      setFalha(mensagemDeErro(erro, 'salvar'));
      // O aviso fica no topo do painel e o botão no rodapé: leva o foco até ele.
      setTimeout(() => {
        refFalha.current?.scrollIntoView({ block: 'nearest' });
        refFalha.current?.focus();
      }, 0);
    },
  });

  const mudar = (chave: string, valor: unknown) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    setErros((e) => ({ ...e, [chave]: undefined }));
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    const novosErros = validarCadastro(config, dados as Omit<T, 'id'>);
    setErros(novosErros);
    const primeiro = config.campos.find((c) => novosErros[c.chave]);
    if (primeiro) {
      area.current?.querySelector<HTMLElement>(`[data-campo="${primeiro.chave}"] :is(input:not([type=hidden]):not([aria-hidden=true]), textarea, [role=combobox], button)`)?.focus();
      return;
    }
    setFalha(null);
    salvar.mutate(dados as Omit<T, 'id'>);
  };

  return (
    <Drawer
      open
      onOpenChange={(a) => { if (!a && !salvar.isPending) aoFechar(); }}
      title={titulo}
      footer={
        <>
          <Button type="button" variant="secondary" className="max-md:h-11 max-md:flex-1" disabled={salvar.isPending} onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form={idForm} className="max-md:h-11 max-md:flex-1" loading={salvar.isPending}>Salvar</Button>
        </>
      }
    >
      <form id={idForm} ref={area} noValidate onSubmit={enviar} className="grid gap-5">
        {falha && (
          <p ref={refFalha} tabIndex={-1} role="alert" className="rounded-md bg-[var(--color-danger-bg)] p-3 text-sm font-semibold text-[var(--color-danger-text)] outline-none focus-visible:ring-3 focus-visible:ring-ring">
            {falha}
          </p>
        )}
        {config.campos.map((c) => (
          <div key={c.chave} data-campo={c.chave}>
            <Campo campo={c} valor={dados[c.chave]} erro={erros[c.chave]} bloqueado={Boolean(item && c.fixoAoEditar)} aoMudar={(v) => mudar(c.chave, v)} />
          </div>
        ))}
      </form>
    </Drawer>
  );
}

function Campo<T>({ campo, valor, erro, bloqueado, aoMudar }: { campo: CampoCadastro<T>; valor: unknown; erro?: string; bloqueado: boolean; aoMudar: (v: unknown) => void }) {
  const rotulo = campo.obrigatorio ? `${campo.rotulo} *` : campo.rotulo;
  const dica = bloqueado ? 'Não pode ser alterado.' : campo.dica;
  const texto = typeof valor === 'string' ? valor : '';
  switch (campo.tipo) {
    case 'alternar':
      return (
        <div className="grid gap-1">
          <Toggle label={campo.rotulo} checked={Boolean(valor)} disabled={bloqueado} onCheckedChange={aoMudar} className="max-md:min-h-11" />
          {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
        </div>
      );
    case 'select':
      return (
        <div className="grid gap-1">
          <Select label={rotulo} placeholder="Selecione" options={campo.opcoes} value={texto || null} disabled={bloqueado} error={erro} onValueChange={(v) => aoMudar(v ?? '')} className="max-md:[&_[role=combobox]]:h-11" />
          {dica && !erro && <p className="text-xs text-muted-foreground">{dica}</p>}
        </div>
      );
    case 'data':
      return <DateField label={rotulo} value={texto} disabled={bloqueado} error={erro} hint={dica} onChange={aoMudar} className="max-md:[&_input]:h-11" />;
    case 'numero':
      return (
        <Field
          label={rotulo}
          error={erro}
          hint={dica}
          inputProps={{
            type: 'number',
            inputMode: 'numeric',
            min: campo.minimo,
            max: campo.maximo,
            disabled: bloqueado,
            value: valor === null || valor === undefined ? '' : String(valor),
            onValueChange: (v: string) => aoMudar(v === '' ? '' : Number(v)),
            className: 'max-md:h-11',
          }}
        />
      );
    case 'textoLongo':
      return (
        <Field
          label={rotulo}
          error={erro}
          hint={dica}
          inputProps={{ value: texto, disabled: bloqueado, maxLength: campo.maximo, onValueChange: (v: string) => aoMudar(v), render: <textarea rows={4} />, className: 'h-auto min-h-24 py-2' }}
        />
      );
    default:
      return (
        <Field
          label={rotulo}
          error={erro}
          hint={dica}
          inputProps={{ type: campo.tipo === 'hora' ? 'time' : 'text', value: texto, disabled: bloqueado, maxLength: campo.maximo, onValueChange: (v: string) => aoMudar(v), className: 'max-md:h-11' }}
        />
      );
  }
}
