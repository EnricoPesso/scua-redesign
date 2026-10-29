import { DateField } from "@/components/ui/date-field"
import { Field } from "@/components/ui/field"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select } from "@/components/ui/select"
import { lerLista as lista, lerTexto as texto } from "@/lib/relatorio"
import type { FiltroDef, ValoresFiltro } from "./tipos"

type FiltrosProps = {
  filtros: FiltroDef[]
  valores: ValoresFiltro
  onChange: (v: ValoresFiltro) => void
  erroPeriodo?: string
}

export function Filtros({ filtros, valores, onChange, erroPeriodo }: FiltrosProps) {
  const set = (chave: string, valor: string | string[]) => onChange({ ...valores, [chave]: valor })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {filtros.map((f) => {
        switch (f.tipo) {
          case "multi":
            return <MultiSelect key={f.chave} label={f.rotulo} placeholder="Todos" options={f.opcoes} values={lista(valores, f.chave)} onValuesChange={(v) => set(f.chave, v)} />
          case "select":
            return (
              <Select
                key={f.chave}
                label={f.rotulo}
                placeholder="Todos"
                options={[{ value: "", label: "Todos" }, ...f.opcoes]}
                value={texto(valores, f.chave)}
                onValueChange={(v) => set(f.chave, v ?? "")}
              />
            )
          case "texto":
            return (
              <Field
                key={f.chave}
                label={f.rotulo}
                inputProps={{ value: texto(valores, f.chave), placeholder: f.placeholder, onChange: (e) => set(f.chave, e.currentTarget.value) }}
              />
            )
          case "periodo": {
            const inicio = texto(valores, "inicio")
            const fim = texto(valores, "fim")
            return [
              <DateField key="inicio" label="Data inicial" value={inicio} max={fim || undefined} onChange={(v) => set("inicio", v)} />,
              <DateField key="fim" label="Data final" value={fim} min={inicio || undefined} onChange={(v) => set("fim", v)} error={erroPeriodo} />,
            ]
          }
        }
      })}
    </div>
  )
}
