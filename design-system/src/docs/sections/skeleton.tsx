import { Skeleton } from "@/components/ui/skeleton"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function SkeletonSection() {
  return (
    <DocSection id="skeleton" title="Skeleton" description="Reserva o espaço do conteúdo enquanto ele carrega. Marque o contêiner com aria-busy.">
      <StateGrid className="sm:grid-cols-3">
        <StateCell label="Linha"><div aria-busy="true"><Skeleton className="h-4 w-full" /></div></StateCell>
        <StateCell label="Bloco"><div aria-busy="true"><Skeleton className="h-24 w-full rounded-lg" /></div></StateCell>
        <StateCell label="Card">
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { Skeleton } from "@/components/ui/skeleton"

<div aria-busy="true">
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-10 w-2/3" />
</div>`}
      />
    </DocSection>
  )
}
