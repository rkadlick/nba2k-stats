// src/components/ThemeToggle.tsx
"use client";

import { useTheme } from "@/hooks/ui/useTheme";

interface ThemeToggleProps {
  className?: string;
  size?: "md" | "sm";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const dimensions =
    size === "sm"
      ? { button: 36, icon: "h-4 w-4" }
      : { button: 42, icon: "h-5 w-5" };

  return (
    <button
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] text-[color:var(--color-text)] shadow-sm transition-all duration-200 cursor-pointer",
        "hover:bg-[color:var(--color-surface)] hover:shadow-md",
        "active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]",
        className
      )}
      style={{
        width: dimensions.button,
        height: dimensions.button,
      }}
    >
      {isDark ? <MoonIcon className={dimensions.icon} /> : <SunIcon className={dimensions.icon} />}
    </button>
  );
}

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("pointer-events-none", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m16.95 6.95-1.4-1.4M6.45 6.45l-1.4-1.4m0 14.9 1.4-1.4m12.1-12.1 1.4-1.4" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("pointer-events-none", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
