import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateField } from '@/components/ui/date-field';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { mensagemDeErro } from '../../../lib/mensagens';
import { hoje } from '../../../mock/datas';
import { PESSOAS_DIRETORIO, nomeDe } from '../../../mock/diretorio';
import { salvarSubstituto } from '../api';
import { resumoSubstituto } from '../domain/formatacao';
import type { Substituto } from '../domain/tipos';
import { semErros, validarSubstituto, type CampoSubstituto, type Erros } from '../domain/validacao';
import { AVISO_DE_FALHA, ID_FORM_ABA, focarPrimeiroInvalido, useFocarAviso, useGravar, type PropsAba } from './apoio';

const VAZIO: Substituto = { pessoaId: '', de: '', ate: '' };
const igual = (a: Substituto, b: Substituto) => a.pessoaId === b.pessoaId && a.de === b.de && a.ate === b.ate;

export function AbaSubstituto({ usuario, aoMudarSujo, aoSalvando }: PropsAba) {
  const toast = useToast();
  const gravar = useGravar(usuario.id);
  const area = useRef<HTMLFormElement>(null);
  const salvo = usuario.substituto ?? VAZIO;
  const [dados, setDados] = useState<Substituto>(salvo);
  const [erros, setErros] = useState<Erros<CampoSubstituto>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const refFalha = useFocarAviso<HTMLParagraphElement>(falha);
  const sujo = !igual(dados, salvo);
  const ano = hoje().slice(0, 4);

  const opcoes = PESSOAS_DIRETORIO.filter((p) => p.id !== usuario.id).map((p) => ({ value: p.id, label: p.nome })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  const salvar = useMutation({
    mutationFn: (s: Substituto) => salvarSubstituto(usuario.id, s),
    onSuccess: (u, s) => {
      gravar(u);
      setFalha(null);
      toast.success(`${nomeDe(s.pessoaId)} agora aprova no lugar de ${usuario.nome}.`);
    },
    onError: (erro) => {
      console.error(erro);
      setFalha(mensagemDeErro(erro, 'salvar'));
    },
  });
  const remover = useMutation({
    mutationFn: () => salvarSubstituto(usuario.id, null),
    onSuccess: (u) => {
      gravar(u);
      setDados(VAZIO);
      setErros({});
      setFalha(null);
      setRemovendo(false);
      toast.success(`Substituto de ${usuario.nome} removido.`);
    },
    onError: (erro) => {
      console.error(erro);
      setRemovendo(false);
      toast.error(mensagemDeErro(erro, 'excluir'));
    },
  });
  useEffect(() => aoMudarSujo(sujo), [sujo, aoMudarSujo]);
  useEffect(() => aoSalvando(salvar.isPending), [salvar.isPending, aoSalvando]);
  useEffect(() => () => { aoMudarSujo(false); aoSalvando(false); }, [aoMudarSujo, aoSalvando]);

  const mudar = <K extends keyof Substituto>(chave: K, valor: Substituto[K]) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    setErros((e) => ({ ...e, [chave]: undefined }));
  };
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    const novos = validarSubstituto(dados, usuario.id);
    setErros(novos);
    if (!semErros(novos)) {
      focarPrimeiroInvalido(area);
      return;
    }
    setFalha(null);
    salvar.mutate(dados);
  };

  return (
    <div className="grid gap-4">
      {usuario.substituto ? (
        <div className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
          <p role="status" className="text-sm font-semibold text-foreground">
            {resumoSubstituto(nomeDe(usuario.substituto.pessoaId), usuario.nome, usuario.substituto.de, usuario.substituto.ate, ano)}
          </p>
          <Button type="button" variant="secondary" className="w-fit max-md:h-11" onClick={() => setRemovendo(true)}>Remover substituto</Button>
        </div>
      ) : (
        <EmptyState
          title="Nenhum substituto definido"
          description={`O substituto aprova os pedidos de extensão no lugar de ${usuario.nome} enquanto a pessoa estiver fora, como em férias ou licença. Escolha quem e o período abaixo.`}
        />
      )}

      <form id={ID_FORM_ABA} ref={area} noValidate onSubmit={enviar} className="grid gap-4">
        {falha && <p ref={refFalha} tabIndex={-1} role="alert" className={AVISO_DE_FALHA}>{falha}</p>}
        <h3 className="text-sm font-bold text-foreground">{usuario.substituto ? 'Alterar substituto' : 'Definir substituto'}</h3>
        <Select label="Quem aprova no lugar *" placeholder="Selecione" options={opcoes} value={dados.pessoaId || null} error={erros.pessoaId} onValueChange={(v) => mudar('pessoaId', v ?? '')} className="max-md:[&_[role=combobox]]:h-11" />
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField label="De *" value={dados.de} error={erros.de} onChange={(v) => mudar('de', v)} className="max-md:[&_input]:h-11" />
          <DateField label="Até *" value={dados.ate} min={dados.de || undefined} error={erros.ate} onChange={(v) => mudar('ate', v)} className="max-md:[&_input]:h-11" />
        </div>
      </form>

      <ConfirmDialog
        open={removendo}
        onOpenChange={(a) => { if (!a) setRemovendo(false); }}
        title="Remover o substituto?"
        description={`Os pedidos de extensão de ${usuario.nome} voltam a ser aprovados só por quem é gestor da pessoa.`}
        confirmLabel="Remover substituto"
        destructive
        loading={remover.isPending}
        onConfirm={() => remover.mutate()}
      />
    </div>
  );
}
