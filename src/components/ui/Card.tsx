import React from "react";

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-[#ede7da] border border-[#cfc9bc] rounded ${
        hover ? "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-[#b8b2a6] hover:shadow-[0_8px_24px_rgba(20,18,16,0.1)]" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {children}
    </div>
  );
}
