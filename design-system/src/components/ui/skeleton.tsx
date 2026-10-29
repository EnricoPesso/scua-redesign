import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: Omit<ComponentProps<"div">, "children">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }
