import React, { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  href?: string;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    children,
    href,
    loading = false,
    className = "",
    disabled,
    ...props
  },
  ref
) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c94030] disabled:opacity-50 disabled:cursor-not-allowed rounded";

  const variants: Record<string, string> = {
    primary:
      "btn-sheen bg-[#c94030] text-white border border-[#c94030] hover:bg-[#a83228] hover:border-[#a83228] active:scale-[0.98] shadow-[0_2px_8px_rgba(201,64,48,0.2)] hover:shadow-[0_6px_20px_rgba(201,64,48,0.3)]",
    secondary:
      "bg-transparent text-[#141210] border border-[#cfc9bc] hover:border-[#b8b2a6] hover:bg-[#e6dfd1] active:scale-[0.98]",
    ghost:
      "bg-transparent text-[#6b6258] hover:text-[#141210] hover:bg-[#e6dfd1] border border-transparent",
    danger:
      "bg-[rgba(199,44,44,0.08)] text-[#c72c2c] border border-[rgba(199,44,44,0.25)] hover:bg-[rgba(199,44,44,0.15)] active:scale-[0.98]",
    outline:
      "bg-transparent text-[#3a3530] border border-[#cfc9bc] hover:border-[#141210] hover:bg-[#ede7da] active:scale-[0.98]",
  };

  const sizes: Record<string, string> = {
    sm: "text-[0.75rem] tracking-[0.07em] uppercase px-4 py-2 gap-1.5",
    md: "text-[0.8125rem] tracking-[0.06em] uppercase px-5 py-2.5 gap-2",
    lg: "text-[0.8375rem] tracking-[0.06em] uppercase px-7 py-3.5 gap-2.5",
  };

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});
