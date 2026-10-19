import React, { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
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
  const baseStyles =
    "inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] font-mono uppercase";

  const variants = {
    primary:
      "bg-accent text-white hover:bg-accent-hover border border-accent shadow-[0_10px_24px_-8px_rgba(200,67,44,0.45)] tracking-wider",
    secondary:
      "bg-secondary text-ink border-2 border-border-strong hover:bg-tertiary tracking-wider",
    ghost:
      "bg-transparent text-text-secondary hover:text-text-primary hover:bg-tertiary border border-transparent",
    danger:
      "bg-danger/10 text-danger border border-danger/40 hover:bg-danger/20 tracking-wider",
  };

  const sizes = {
    sm: "text-mono-sm px-4 py-2 gap-1.5",
    md: "text-mono-sm px-6 py-3 gap-2",
    lg: "text-body-sm px-8 py-4 gap-2.5",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

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
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});
