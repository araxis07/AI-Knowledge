import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "accent" | "ghost" | "primary" | "secondary";
type ButtonSize = "lg" | "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function buttonStyles({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string | undefined;
  size?: ButtonSize | undefined;
  variant?: ButtonVariant | undefined;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700/30 disabled:cursor-not-allowed disabled:opacity-60",
    size === "lg" && "min-h-12 px-6 text-sm",
    size === "md" && "min-h-11 px-5 text-sm",
    size === "sm" && "min-h-9 px-4 text-xs tracking-[0.08em] uppercase",
    variant === "primary" &&
      "bg-[var(--app-panel-ink)] text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.75)] hover:-translate-y-0.5 hover:bg-slate-800",
    variant === "accent" &&
      "bg-[linear-gradient(135deg,#155e75,#0f766e)] text-white shadow-[0_20px_46px_-24px_rgba(21,94,117,0.72)] hover:-translate-y-0.5 hover:brightness-105",
    variant === "secondary" &&
      "border border-[var(--app-border)] bg-white/82 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:-translate-y-0.5 hover:border-[var(--app-border-strong)] hover:bg-white",
    variant === "ghost" &&
      "text-slate-600 hover:bg-white/70 hover:text-slate-950",
    className,
  );
}

export function Button({ className, size, type = "button", variant, ...props }: ButtonProps) {
  return <button className={buttonStyles({ className, size, variant })} type={type} {...props} />;
}
