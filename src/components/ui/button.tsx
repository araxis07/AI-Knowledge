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
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700/28 disabled:cursor-not-allowed disabled:opacity-60",
    size === "lg" && "min-h-12 px-6 text-sm",
    size === "md" && "min-h-11 px-5 text-sm",
    size === "sm" && "min-h-9 px-4 text-[11px] tracking-[0.08em] uppercase",
    variant === "primary" &&
      "border border-slate-900/90 bg-[var(--app-panel-ink)] text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.62)] hover:-translate-y-0.5 hover:bg-slate-900",
    variant === "accent" &&
      "border border-teal-900/20 bg-[linear-gradient(135deg,#134e63,#0f766e)] text-white shadow-[0_22px_48px_-24px_rgba(21,94,117,0.56)] hover:-translate-y-0.5 hover:brightness-105",
    variant === "secondary" &&
      "border border-[var(--app-border-strong)] bg-white text-slate-900 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.26)] hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50",
    variant === "ghost" &&
      "text-slate-700 hover:bg-slate-900/6 hover:text-slate-950",
    className,
  );
}

export function Button({ className, size, type = "button", variant, ...props }: ButtonProps) {
  return <button className={buttonStyles({ className, size, variant })} type={type} {...props} />;
}
