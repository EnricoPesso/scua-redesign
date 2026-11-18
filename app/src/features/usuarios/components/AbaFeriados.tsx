import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { mensagemDeErro } from '../../../lib/mensagens';
import { salvarFeriados } from '../api';
import { CALENDARIOS, type Calendario } from '../domain/tipos';
import { AVISO_DE_FALHA, ID_FORM_ABA, useFocarAviso, useGravar, type PropsAba } from './apoio';

const chave = (l: Calendario[]) => [...l].sort().join(',');

export function AbaFeriados({ usuario, aoMudarSujo, aoSalvando }: PropsAba) {
  const toast = useToast();
  const gravar = useGravar(usuario.id);
  const [marcados, setMarcados] = useState<Calendario[]>(usuario.feriados);
  const [falha, setFalha] = useState<string | null>(null);
  const refFalha = useFocarAviso<HTMLParagraphElement>(falha);
  const sujo = chave(marcados) !== chave(usuario.feriados);

  const salvar = useMutation({
    mutationFn: (l: Calendario[]) => salvarFeriados(usuario.id, l),
    onSuccess: (salvo) => {
      gravar(salvo);
      setFalha(null);
      toast.success(`Feriados de ${usuario.nome} salvos.`);
    },
    onError: (erro) => {
      console.error(erro);
      setFalha(mensagemDeErro(erro, 'salvar'));
    },
  });
  useEffect(() => aoMudarSujo(sujo), [sujo, aoMudarSujo]);
  useEffect(() => aoSalvando(salvar.isPending), [salvar.isPending, aoSalvando]);
  useEffect(() => () => { aoMudarSujo(false); aoSalvando(false); }, [aoMudarSujo, aoSalvando]);

  const alternar = (c: Calendario, marcado: boolean) => setMarcados((atual) => (marcado ? [...atual, c] : atual.filter((x) => x !== c)));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (salvar.isPending) return;
    setFalha(null);
    salvar.mutate(marcados);
  };

  return (
    <form id={ID_FORM_ABA} noValidate onSubmit={enviar} className="grid gap-4">
      {falha && <p ref={refFalha} tabIndex={-1} role="alert" className={AVISO_DE_FALHA}>{falha}</p>}
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-bold text-foreground">Calendários de feriados</legend>
        <p className="text-sm text-muted-foreground">Os feriados dos calendários marcados não contam como dia de trabalho para {usuario.nome}.</p>
        {CALENDARIOS.map((c) => (
          <div key={c.valor} className="grid gap-0.5">
            <Checkbox label={c.rotulo} checked={marcados.includes(c.valor)} onCheckedChange={(m) => alternar(c.valor, m)} className="max-md:min-h-11" />
            <p className="pl-7 text-xs text-muted-foreground">{c.dica}</p>
          </div>
        ))}
      </fieldset>
    </form>
  );
}
