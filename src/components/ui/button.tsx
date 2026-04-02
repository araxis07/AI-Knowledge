import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "ghost" | "primary" | "secondary";
type ButtonSize = "md" | "sm";

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
    "inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 disabled:cursor-not-allowed disabled:opacity-60",
    size === "md" ? "min-h-11 px-5 text-sm" : "min-h-9 px-4 text-sm",
    variant === "primary" &&
      "bg-slate-950 text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.75)] hover:bg-slate-800",
    variant === "secondary" &&
      "border border-[var(--app-border)] bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
    variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    className,
  );
}

export function Button({ className, size, type = "button", variant, ...props }: ButtonProps) {
  return <button className={buttonStyles({ className, size, variant })} type={type} {...props} />;
}
