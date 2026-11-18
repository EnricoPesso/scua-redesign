import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/components/ui/use-toast';
import { mensagemDeErro } from '../../../lib/mensagens';
import { PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import { salvarDados } from '../api';
import { DEPARTAMENTOS, JORNADAS_ATRIBUIVEIS } from '../dados';
import { PERMISSOES, type DadosUsuario, type Usuario } from '../domain/tipos';
import { semErros, validarDados, type Erros, type CampoDados } from '../domain/validacao';
import { AVISO_DE_FALHA, ID_FORM_ABA, focarPrimeiroInvalido, useFocarAviso, useGravar, type PropsAba } from './apoio';

const SEM_GESTOR = '__sem_gestor';
const OPCOES_DEPARTAMENTO = DEPARTAMENTOS.map((d) => ({ value: d, label: d }));
const OPCOES_JORNADA = JORNADAS_ATRIBUIVEIS.map((j) => ({ value: j.id, label: j.nome }));
const dadosDe = (u: Usuario): DadosUsuario => ({ email: u.email, whatsapp: u.whatsapp, gestorId: u.gestorId, departamento: u.departamento, jornadaId: u.jornadaId, permissoes: { ...u.permissoes } });
const iguais = (a: DadosUsuario, b: DadosUsuario) => JSON.stringify(a) === JSON.stringify(b);

export function AbaDados({ usuario, aoMudarSujo, aoSalvando }: PropsAba) {
  const toast = useToast();
  const gravar = useGravar(usuario.id);
  const area = useRef<HTMLFormElement>(null);
  const [dados, setDados] = useState<DadosUsuario>(() => dadosDe(usuario));
  const [erros, setErros] = useState<Erros<CampoDados>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const refFalha = useFocarAviso<HTMLParagraphElement>(falha);
  const sujo = !iguais(dados, dadosDe(usuario));

  const opcoesGestor = [
    { value: SEM_GESTOR, label: 'Sem gestor' },
    ...PESSOAS_DIRETORIO.filter((p) => p.id !== usuario.id).map((p) => ({ value: p.id, label: p.nome })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
  ];

  const salvar = useMutation({
    mutationFn: (d: DadosUsuario) => salvarDados(usuario.id, d),
    onSuccess: (salvo) => {
      gravar(salvo);
      setFalha(null);
      toast.success(`Dados de ${usuario.nome} salvos.`);
    },
    onError: (erro) => {
      console.error(erro);
      setFalha(mensagemDeErro(erro, 'salvar'));
    },
  });
  useEffect(() => aoMudarSujo(sujo), [sujo, aoMudarSujo]);
  useEffect(() => aoSalvando(salvar.isPending), [salvar.isPending, aoSalvando]);
  useEffect(() => () => { aoMudarSujo(false); aoSalvando(false); }, [aoMudarSujo, aoSalvando]);

  const mudar = <K extends keyof DadosUsuario>(chave: K, valor: DadosUsuario[K]) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    setErros((e) => ({ ...e, [chave]: undefined }));
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    const novos = validarDados(dados);
    setErros(novos);
    if (!semErros(novos)) {
      focarPrimeiroInvalido(area);
      return;
    }
    setFalha(null);
    salvar.mutate(dados);
  };

  return (
    <form id={ID_FORM_ABA} ref={area} noValidate onSubmit={enviar} className="grid gap-5">
      {falha && <p ref={refFalha} tabIndex={-1} role="alert" className={AVISO_DE_FALHA}>{falha}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" inputProps={{ value: usuario.nome, readOnly: true, className: 'bg-muted max-md:h-11' }} />
        <Field label="Login" inputProps={{ value: usuario.login, readOnly: true, className: 'bg-muted max-md:h-11' }} />
        <Field label="Matrícula" inputProps={{ value: usuario.matricula, readOnly: true, className: 'bg-muted max-md:h-11' }} />
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">Nome, login e matrícula vêm do cadastro da empresa e não podem ser alterados aqui.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail *" error={erros.email} inputProps={{ type: 'email', value: dados.email, onValueChange: (v: string) => mudar('email', v), className: 'max-md:h-11' }} />
        <Field label="WhatsApp" hint="Com DDD, como (11) 91234-5678." error={erros.whatsapp} inputProps={{ type: 'tel', value: dados.whatsapp, onValueChange: (v: string) => mudar('whatsapp', v), className: 'max-md:h-11' }} />
        <Select label="Gestor" options={opcoesGestor} value={dados.gestorId ?? SEM_GESTOR} onValueChange={(v) => mudar('gestorId', !v || v === SEM_GESTOR ? null : v)} className="max-md:[&_[role=combobox]]:h-11" />
        <Select label="Departamento *" placeholder="Selecione" options={OPCOES_DEPARTAMENTO} value={dados.departamento || null} error={erros.departamento} onValueChange={(v) => mudar('departamento', v ?? '')} className="max-md:[&_[role=combobox]]:h-11" />
        <Select label="Jornada *" placeholder="Selecione" options={OPCOES_JORNADA} value={dados.jornadaId || null} error={erros.jornadaId} onValueChange={(v) => mudar('jornadaId', v ?? '')} className="max-md:[&_[role=combobox]]:h-11" />
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-bold text-foreground">Permissões</legend>
        {PERMISSOES.map((p) => (
          <div key={p.chave} className="grid gap-1">
            <Toggle label={p.rotulo} checked={dados.permissoes[p.chave]} onCheckedChange={(c) => mudar('permissoes', { ...dados.permissoes, [p.chave]: c })} className="max-md:min-h-11" />
            <p className="text-xs text-muted-foreground">{p.dica}</p>
          </div>
        ))}
      </fieldset>
    </form>
  );
}
