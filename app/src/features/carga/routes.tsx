import { Pagina } from '../../componentes/Pagina';
import { CartaoCarga } from './components/CartaoCarga';
import { HistoricoCargas } from './components/HistoricoCargas';
import { CARGAS } from './domain/cargas';

export default function Rotas() {
  return (
    <Pagina titulo="Carga de dados" trilha={[]} descricao="Importe muitos registros de uma vez com um arquivo CSV. Você confere tudo antes de importar.">
      <ol className="grid gap-2 rounded-lg bg-[var(--color-surface-muted)] p-4 text-sm text-foreground sm:grid-cols-3">
        <li><strong>1. Baixe o modelo</strong> da carga que você precisa.</li>
        <li><strong>2. Preencha</strong> no Excel e salve como CSV.</li>
        <li><strong>3. Envie o arquivo</strong> e confira a prévia antes de importar.</li>
      </ol>
      <div className="grid gap-4 lg:grid-cols-2">
        {CARGAS.map((c) => <CartaoCarga key={c.id} carga={c} />)}
      </div>
      <HistoricoCargas />
    </Pagina>
  );
}
