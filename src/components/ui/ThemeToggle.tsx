"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "pill" | "sidebar";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Avoid hydration mismatch until mounted
  if (!mounted) {
    return (
      <div
        className={`w-8 h-8 rounded-lg bg-zinc-200/50 dark:bg-white/[0.06] animate-pulse ${className}`}
      />
    );
  }

  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-full bg-zinc-200/80 dark:bg-white/[0.08] border border-zinc-300 dark:border-white/[0.1] transition-colors ${className}`}
      >
        <button
          type="button"
          onClick={() => isDark && toggleTheme()}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            !isDark
              ? "bg-white text-zinc-900 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
          title="Mode Terang (Light Mode)"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => !isDark && toggleTheme()}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            isDark
              ? "bg-[#252830] text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
          title="Mode Gelap (Dark Mode)"
        >
          <Moon className="w-3.5 h-3.5 text-sky-400" />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
          isDark
            ? "bg-[#202226] hover:bg-[#282a30] text-zinc-300 border-white/[0.08]"
            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300"
        } ${className}`}
        title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span>{isDark ? "Mode Gelap" : "Mode Terang"}</span>
        </div>
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.1] text-zinc-600 dark:text-zinc-300">
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    );
  }

  // Default "icon" variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
        isDark
          ? "bg-[#1b1c1d] hover:bg-[#25272a] text-amber-400 border border-white/[0.1]"
          : "bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs"
      } ${className}`}
      title={isDark ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-sky-600 transition-transform hover:-rotate-12 duration-300" />
      )}
    </button>
  );
}
