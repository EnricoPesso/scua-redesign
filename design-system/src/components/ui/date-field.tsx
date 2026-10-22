import { Field } from "./field"

type DateFieldProps = {
  label: string
  min?: string
  max?: string
  error?: string
  hint?: string
  disabled?: boolean
  name?: string
  required?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
}

function DateField({ label, min, max, error, hint, disabled, name, required, value, defaultValue, onChange, className }: DateFieldProps) {
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      disabled={disabled}
      className={className}
      inputProps={{
        type: "date",
        name,
        required,
        min,
        max,
        value,
        defaultValue,
        onValueChange: onChange ? (v: string) => onChange(v) : undefined,
      }}
    />
  )
}

export { DateField }
export type { DateFieldProps }
