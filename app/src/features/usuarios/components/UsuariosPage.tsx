import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { paginate } from '@/lib/paginate';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { GESTORES } from '../../../mock/diretorio';
import { DEPARTAMENTOS } from '../dados';
import { filtrarUsuarios, temFiltro, textoContagem, type Situacao } from '../domain/filtros';
import { Carregando, useUsuarios } from './apoio';
import { Paginacao } from '../../../componentes/Paginacao';
import { TabelaUsuarios } from './TabelaUsuarios';
import { BotaoExportar } from '../../../componentes/BotaoExportar';
import { COLUNAS_PLANILHA } from '../planilha';
import { useFiltrosUsuarios } from './useFiltrosUsuarios';

const TODOS = '__todos';
const ATRASO_DA_BUSCA_MS = 300;
const OPCOES_GESTOR = [{ value: TODOS, label: 'Todos os gestores' }, ...GESTORES.map((g) => ({ value: g.id, label: g.nome })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))];
const OPCOES_DEPARTAMENTO = [{ value: TODOS, label: 'Todos os departamentos' }, ...DEPARTAMENTOS.map((d) => ({ value: d, label: d }))];
const OPCOES_SITUACAO: { value: Situacao; label: string }[] = [
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
  { value: 'todos', label: 'Todos' },
];

export function UsuariosPage() {
  const { filtros, atualizar, limpar } = useFiltrosUsuarios();
  const lista = useUsuarios();

  // A busca digitada só vai para a URL depois de uma pausa; mudanças vindas da URL (Limpar filtros) voltam para o campo.
  const [texto, setTexto] = useState(filtros.busca);
  const ultimaEscrita = useRef(filtros.busca);
  useEffect(() => {
    if (filtros.busca !== ultimaEscrita.current) {
      ultimaEscrita.current = filtros.busca;
      setTexto(filtros.busca);
    }
  }, [filtros.busca]);
  useEffect(() => {
    const novo = texto.trim();
    if (novo === ultimaEscrita.current) return;
    const id = setTimeout(() => {
      ultimaEscrita.current = novo;
      atualizar({ busca: novo });
    }, ATRASO_DA_BUSCA_MS);
    return () => clearTimeout(id);
  }, [texto, atualizar]);

  const filtrados = useMemo(() => filtrarUsuarios(lista.data ?? [], filtros), [lista.data, filtros]);
  const info = paginate({ total: filtrados.length, page: filtros.pagina, pageSize: filtros.tamanho });
  const visiveis = filtrados.slice(Math.max(0, info.from - 1), info.to);
  const comFiltro = temFiltro(filtros);

  let corpo;
  if (lista.isPending) {
    corpo = <Carregando rotulo="Carregando usuários" />;
  } else if (lista.isError) {
    corpo = <EstadoErro erro={lista.error} aoTentar={() => void lista.refetch()} />;
  } else if (filtrados.length === 0) {
    corpo = (
      <EmptyState
        title={comFiltro ? 'Nenhum usuário com esses filtros' : 'Nenhum usuário cadastrado'}
        description={comFiltro ? 'Mude a busca ou os filtros para ver mais pessoas.' : 'Os usuários chegam pela carga de dados e aparecem aqui.'}
        action={comFiltro ? <Button variant="secondary" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button> : undefined}
      />
    );
  } else {
    corpo = (
      <>
        <TabelaUsuarios usuarios={visiveis} />
        <Paginacao total={filtrados.length} pagina={info.page} tamanho={filtros.tamanho} aoMudar={(pagina, tamanho) => atualizar({ pagina: String(pagina), tamanho: String(tamanho) })} />
      </>
    );
  }

  return (
    <Pagina
      titulo="Usuários"
      descricao="Pessoas com acesso ao Scua Logon. Abra uma pessoa para ver e ajustar os dados, feriados, substituto, exceções e férias."
      acoes={<BotaoExportar arquivo="usuarios" colunas={COLUNAS_PLANILHA} linhas={filtrados} desabilitado={lista.isPending || lista.isError} />}
    >
      <section aria-label="Lista de usuários" className="grid min-w-0 gap-4">
        <div role="search" aria-label="Filtros de usuários" className="grid gap-3 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <Field
            label="Buscar por nome ou login"
            inputProps={{ type: 'search', value: texto, placeholder: 'Ex.: ana ou ana.souza', onValueChange: (v: string) => setTexto(v), className: 'max-md:h-11' }}
          />
          <Select
            label="Gestor"
            options={OPCOES_GESTOR}
            value={filtros.gestor || TODOS}
            onValueChange={(v) => atualizar({ gestor: !v || v === TODOS ? '' : v })}
            className="max-md:[&_[role=combobox]]:h-11"
          />
          <Select
            label="Departamento"
            options={OPCOES_DEPARTAMENTO}
            value={filtros.departamento || TODOS}
            onValueChange={(v) => atualizar({ departamento: !v || v === TODOS ? '' : v })}
            className="max-md:[&_[role=combobox]]:h-11"
          />
          <Select
            label="Situação"
            options={OPCOES_SITUACAO}
            value={filtros.situacao}
            onValueChange={(v) => atualizar({ situacao: v ?? 'ativos' })}
            className="max-md:[&_[role=combobox]]:h-11"
          />
        </div>
        {lista.isSuccess && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="text-sm font-semibold text-foreground">{textoContagem(filtrados.length, filtros)}</p>
            {comFiltro && filtrados.length > 0 && <Button variant="secondary" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button>}
          </div>
        )}
        {corpo}
      </section>
      <Outlet />
    </Pagina>
  );
}
