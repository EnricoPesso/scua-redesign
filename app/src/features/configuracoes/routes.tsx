import { Fragment, type ReactElement } from 'react';
import { Link, Route, Routes, useParams } from 'react-router';
import { ModeloCadastro } from '../../componentes/cadastro/ModeloCadastro';
import { Pagina } from '../../componentes/Pagina';
import { NaoEncontrada } from '../../layout/ErroGlobal';
import { AREAS, CONFIGURACOES } from './catalogo';
import { configDominios } from './cadastros/dominios';
import { configFeriados } from './cadastros/feriados';
import { configGrupos } from './cadastros/grupos';
import { configJustificativas } from './cadastros/justificativas';
import { configLocalidadesPorIp } from './cadastros/localidades-por-ip';
import { configMensagens } from './cadastros/mensagens';
import { configMensagensPorTempo } from './cadastros/mensagens-por-tempo';
import { configNotificacoes } from './cadastros/notificacoes';
import { configNotificacoesDeRecorrencia } from './cadastros/notificacoes-de-recorrencia';
import { configParametros } from './cadastros/parametros';
import { configTemplatesWhatsapp } from './cadastros/templates-whatsapp';
import { configTiposDeJornada } from './cadastros/tipos-de-jornada';

const TELAS: Record<string, ReactElement> = {
  'tipos-de-jornada': <ModeloCadastro config={configTiposDeJornada} />,
  justificativas: <ModeloCadastro config={configJustificativas} />,
  feriados: <ModeloCadastro config={configFeriados} />,
  mensagens: <ModeloCadastro config={configMensagens} />,
  'mensagens-por-tempo': <ModeloCadastro config={configMensagensPorTempo} />,
  'templates-whatsapp': <ModeloCadastro config={configTemplatesWhatsapp} />,
  notificacoes: <ModeloCadastro config={configNotificacoes} />,
  'notificacoes-de-recorrencia': <ModeloCadastro config={configNotificacoesDeRecorrencia} />,
  dominios: <ModeloCadastro config={configDominios} />,
  grupos: <ModeloCadastro config={configGrupos} />,
  'localidades-por-ip': <ModeloCadastro config={configLocalidadesPorIp} />,
  parametros: <ModeloCadastro config={configParametros} />,
};

function PaginaInicial() {
  return (
    <Pagina titulo="Configurações" descricao="Ajustes de jornada, mensagens e funcionamento do sistema.">
      <div className="flex flex-col gap-8">
        {AREAS.map((area) => (
          <section key={area.id} aria-labelledby={`area-${area.id}`} className="flex flex-col gap-3">
            <h2 id={`area-${area.id}`} className="font-heading text-base font-bold text-foreground">{area.titulo}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CONFIGURACOES.filter((c) => c.area === area.id).map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/configuracoes/${c.slug}`}
                    className="flex h-full min-h-11 flex-col gap-1 rounded-lg border border-border bg-card p-4 outline-none hover:bg-[var(--color-row-hover)] focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    <span className="font-semibold text-[var(--color-brand-text)]">{c.titulo}</span>
                    <span className="text-sm text-muted-foreground">{c.resumo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Pagina>
  );
}

function Tela() {
  const { slug = '' } = useParams();
  const tela = TELAS[slug];
  if (!tela) return <NaoEncontrada />;
  // A chave limpa busca e painel ao trocar de tela.
  return <Fragment key={slug}>{tela}</Fragment>;
}

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<PaginaInicial />} />
      <Route path=":slug" element={<Tela />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
