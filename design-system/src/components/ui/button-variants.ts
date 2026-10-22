import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex shrink-0 touch-manipulation items-center justify-center gap-2 rounded-md border border-transparent font-semibold whitespace-nowrap select-none outline-none transition-colors duration-[var(--dur-fast)] focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-[var(--color-brand-hover)]",
        secondary: "border-[var(--color-line-strong)] bg-card text-foreground hover:bg-secondary",
        destructive: "bg-destructive text-[var(--color-on-danger)] hover:bg-[var(--color-danger-hover)]",
        ghost: "text-foreground hover:bg-muted",
        link: "text-[var(--color-brand-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
)
