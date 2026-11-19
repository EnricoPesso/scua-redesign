import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/components/ui/use-toast';
import { Pagina } from '../../componentes/Pagina';
import { baseDe } from '../configuracoes/cadastros/comum';
import { GrupoRadio } from '../extensoes/components/GrupoRadio';
import { consultarEstado } from './api';
import { AVISO } from './Conversa';
import { PROVEDORES, type Provedor } from './contrato';
import { lerConfig, salvarConfig, type ConfigAssistente } from './preferencias';

const NOME_DO_PROVEDOR: Record<Provedor, string> = { anthropic: 'Claude', openai: 'ChatGPT', gemini: 'Gemini' };
const OPCOES_PROVEDOR = PROVEDORES.map((p) => ({ value: p, label: NOME_DO_PROVEDOR[p] }));
const OPCOES_ORIGEM = [
  { valor: 'scua' as const, rotulo: 'Chave da Scua' },
  { valor: 'propria' as const, rotulo: 'Chave própria' },
];

type Conexao = { carregando: true } | { carregando: false; ativo: boolean; provedor: Provedor | null };

/**
 * Configurações › Assistente de IA (só administração).
 * A chave de API nunca é lida de volta nem guardada: ao salvar, o campo esvazia e só os 4 últimos
 * caracteres ficam na memória desta tela, para a pessoa reconhecer qual chave foi cadastrada.
 */
export function ConfigAssistentePage() {
  const toast = useToast();
  const [dados, setDados] = useState<ConfigAssistente>(() => lerConfig());
  const [chave, setChave] = useState('');
  const [fim, setFim] = useState<string | null>(null);
  const [erro, setErro] = useState<string>();
  const [conexao, setConexao] = useState<Conexao>({ carregando: true });

  useEffect(() => {
    const aborto = new AbortController();
    void consultarEstado(aborto.signal).then((e) => {
      if (!aborto.signal.aborted) setConexao({ carregando: false, ...e });
    });
    return () => aborto.abort();
  }, []);

  const propria = dados.origemDaChave === 'propria';

  function salvar(e: FormEvent) {
    e.preventDefault();
    const nova = chave.trim();
    if (propria && !nova && !fim) {
      setErro('Informe a chave de API.');
      return;
    }
    setErro(undefined);
    if (propria && nova) setFim(nova.slice(-4));
    if (!propria) setFim(null);
    setChave('');
    salvarConfig(dados);
    toast.success('Configurações do assistente salvas.');
  }

  const situacao = conexao.carregando
    ? 'Verificando a conexão…'
    : conexao.ativo
      ? `IA conectada${conexao.provedor ? ` (${NOME_DO_PROVEDOR[conexao.provedor]})` : ''}`
      : 'Modo demonstração';

  return (
    <Pagina {...baseDe('assistente-ia')}>
      <form onSubmit={salvar} noValidate className="grid max-w-2xl gap-6">
        <p role="status" className="w-fit rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-semibold text-foreground">
          {situacao}
        </p>

        <Toggle label="Assistente ligado" checked={dados.ativo} onCheckedChange={(ativo) => setDados((d) => ({ ...d, ativo }))} className="max-md:min-h-11" />

        <GrupoRadio
          legenda="De quem é a chave"
          opcoes={OPCOES_ORIGEM}
          valor={dados.origemDaChave}
          aoMudar={(origemDaChave) => {
            setDados((d) => ({ ...d, origemDaChave }));
            setErro(undefined);
          }}
        />

        {propria && (
          <div className="grid gap-4 rounded-lg border border-border bg-card p-4">
            <Select
              label="Provedor"
              options={OPCOES_PROVEDOR}
              value={dados.provedor}
              onValueChange={(v) => {
                if (v) setDados((d) => ({ ...d, provedor: v as Provedor }));
              }}
              className="max-md:[&_button]:h-11"
            />
            <Field
              label="Chave de API"
              error={erro}
              hint={fim ? undefined : 'Depois de salvar, a chave não aparece mais na tela.'}
              inputProps={{
                type: 'password',
                autoComplete: 'off',
                spellCheck: false,
                value: chave,
                onChange: (e) => {
                  setChave(e.target.value);
                  setErro(undefined);
                },
                className: 'max-md:h-11',
              }}
            />
            {fim && <p className="text-sm font-semibold text-[var(--color-success-text)]">Chave cadastrada (termina em …{fim})</p>}
          </div>
        )}

        <Toggle
          label="Permitir aprovação automática"
          checked={dados.permitirAutomatica}
          onCheckedChange={(permitirAutomatica) => setDados((d) => ({ ...d, permitirAutomatica }))}
          className="max-md:min-h-11"
        />

        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>Nesta versão de demonstração a chave não é guardada. A conexão real usa a configuração do servidor.</p>
          <p>{AVISO}</p>
        </div>

        <div>
          <Button type="submit" className="max-md:h-11 max-md:w-full">Salvar</Button>
        </div>
      </form>
    </Pagina>
  );
}
