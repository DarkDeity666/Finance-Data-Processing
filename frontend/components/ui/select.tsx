import { cn } from "@/lib/utils"
import { SelectHTMLAttributes, forwardRef } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200",
        "focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors appearance-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
