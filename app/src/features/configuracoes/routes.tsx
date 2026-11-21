import { Fragment, type ReactElement } from 'react';
import { Link, Route, Routes, useParams } from 'react-router';
import { ModeloCadastro } from '../../componentes/cadastro/ModeloCadastro';
import { Pagina } from '../../componentes/Pagina';
import { ConfigAssistentePage } from '../assistente/ConfigAssistentePage';
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
  'assistente-ia': <ConfigAssistentePage />,
};

function PaginaInicial() {
  return (
    <Pagina titulo="Configurações" descricao="Ajustes de jornada, mensagens e funcionamento do sistema.">
      <div className="flex flex-col gap-8">
        {AREAS.map((area) => (
          <section key={area.id} aria-labelledby={`area-${area.id}`} className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-5">
            <h2 id={`area-${area.id}`} className="font-heading text-base font-semibold tracking-tight text-foreground">{area.titulo}</h2>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {CONFIGURACOES.filter((c) => c.area === area.id).map((c) => (
                <li key={c.slug} className="border-b border-[var(--color-line)]/60 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                  <Link
                    to={`/configuracoes/${c.slug}`}
                    className="group -mx-2 flex h-full min-h-11 flex-col justify-center gap-0.5 rounded-lg px-2 py-3 transition-colors duration-[var(--dur-fast)] outline-none hover:bg-[var(--color-row-hover)] focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-[var(--color-brand-text)]">{c.titulo}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{c.resumo}</span>
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
