import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-[#ededed] dark:text-[#141415] dark:hover:bg-white shadow-xs",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-500 shadow-xs",
        outline:
          "border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#19191b] hover:bg-zinc-100 dark:hover:bg-[#232325] text-zinc-900 dark:text-[#ededed] shadow-xs",
        secondary:
          "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-[#232325] dark:text-[#ededed] dark:hover:bg-[#2b2b2f] border border-zinc-200 dark:border-white/[0.08]",
        ghost: "hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-[#a1a1a6] hover:text-zinc-900 dark:hover:text-[#ededed]",
        link: "text-[#00b5ad] dark:text-amber-400 underline-offset-4 hover:underline p-0 h-auto",
        healthy: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs",
        warning: "bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold shadow-xs",
        pill: "bg-zinc-900 text-white dark:bg-[#ededed] dark:text-[#141415] font-bold rounded-full hover:bg-zinc-800 dark:hover:bg-white px-5 shadow-xs",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-7.5 rounded-md px-2.5 text-[11px]",
        lg: "h-11 rounded-lg px-5 text-sm",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
