import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"
import { cn } from "cn"
import { buttonVariants } from "./button-variants"

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }

function Button({ className, variant, size, loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2Icon className="animate-spin motion-reduce:animate-none" aria-hidden /> : null}
      {children}
    </ButtonPrimitive>
  )
}

export { Button }
export type { ButtonProps }
