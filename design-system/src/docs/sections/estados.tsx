import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function EstadosSection() {
  return (
    <DocSection id="estados" title="Estado vazio e erro" description="Vazio quando não há registros; erro quando a carga falhou. Sempre diga o que fazer em seguida.">
      <StateGrid>
        <StateCell label="Vazio"><EmptyState title="Nenhum colaborador cadastrado" description="Cadastre o primeiro colaborador para montar a escala." /></StateCell>
        <StateCell label="Vazio, com ação">
          <EmptyState title="Nenhum resultado para o filtro" description="Tente outro período ou limpe os filtros." action={<Button variant="secondary">Limpar filtros</Button>} />
        </StateCell>
        <StateCell label="Erro"><ErrorState title="Não foi possível carregar os dados" description="Verifique a conexão e tente de novo." /></StateCell>
        <StateCell label="Erro, com ação">
          <ErrorState title="Não foi possível carregar os dados" description="Se o problema continuar, fale com o suporte." action={<Button>Tentar de novo</Button>} />
        </StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"

<EmptyState title="Nenhum colaborador" description="Cadastre o primeiro." action={<Button>Cadastrar</Button>} />
<ErrorState title="Não foi possível carregar" action={<Button onClick={recarregar}>Tentar de novo</Button>} />`}
      />
    </DocSection>
  )
}
