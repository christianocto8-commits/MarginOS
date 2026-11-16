"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  label?: string;
  unit?: string;
  showValue?: boolean;
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className,
  label,
  unit = "%",
  showValue = false,
}: SliderProps) {
  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showValue && (
            <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 text-xs font-semibold">
              {value} {unit}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full h-2 bg-zinc-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00b5ad] dark:accent-orange-500 hover:accent-teal-600 dark:hover:accent-orange-400 focus:outline-none"
      />
    </div>
  );
}
