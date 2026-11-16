"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  children: React.ReactNode;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export function Dialog({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  className,
  maxWidth = "2xl",
  children,
}: DialogProps) {
  if (!open) return null;

  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const widthClass = maxWidthMap[maxWidth] || "max-w-2xl";

  if (title) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        />
        <div
          className={cn(
            "relative z-50 mx-auto w-full my-auto max-h-[90vh] flex flex-col rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-[#19191b] shadow-2xl text-zinc-900 dark:text-[#ededed] overflow-hidden",
            widthClass,
            className
          )}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex items-start justify-between gap-4 shrink-0 bg-zinc-50 dark:bg-[#161619]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
              {description && <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              aria-label="Tutup popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 text-xs text-zinc-800 dark:text-zinc-200">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />
      <div className={cn("relative z-50 mx-auto w-full my-auto max-h-[90vh] flex flex-col", widthClass)}>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-lg rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-[#19191b] p-5 shadow-2xl text-zinc-900 dark:text-[#ededed]",
        className
      )}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-[#ededed] hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-3 border-b border-zinc-200 dark:border-white/[0.06]", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-sm font-bold text-zinc-900 dark:text-[#ededed]", className)}>
      {children}
    </h3>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-xs text-zinc-600 dark:text-[#85858b]", className)}>
      {children}
    </p>
  );
}

export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-white/[0.06]", className)}>
      {children}
    </div>
  );
}
