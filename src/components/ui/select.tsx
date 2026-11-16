import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg border border-zinc-200 dark:border-white/[0.14] bg-white dark:bg-[#1a1a1d] px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 shadow-xs transition-colors hover:border-zinc-300 dark:hover:border-white/25 focus-visible:outline-none focus-visible:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400/30 focus-visible:bg-white dark:focus-visible:bg-[#222226] disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-[#1a1a1d] [&>option]:text-zinc-900 dark:[&>option]:text-zinc-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
