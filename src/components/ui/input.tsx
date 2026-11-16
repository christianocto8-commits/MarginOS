import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-zinc-300 dark:border-white/[0.14] bg-white dark:bg-[#1a1a1d] px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 shadow-xs transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 hover:border-zinc-400 dark:hover:border-white/25 focus-visible:outline-none focus-visible:border-[#00b5ad] focus-visible:ring-1 focus-visible:ring-[#00b5ad]/30 focus-visible:bg-white dark:focus-visible:bg-[#222226] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
