import React from "react";

interface BadgeProps {
  status: "open" | "upcoming" | "closed";
  label: string;
  className?: string;
}

export function Badge({ status, label, className = "" }: BadgeProps) {
  const statusColors = {
    open: "text-success border-success/30 bg-success/8",
    upcoming: "text-warning border-warning/30 bg-warning/8",
    closed: "text-[#c72c2c] border-[#c72c2c]/30 bg-[#c72c2c]/8",
  };

  const dotColors = {
    open: "status-dot--open",
    upcoming: "status-dot--upcoming",
    closed: "status-dot--closed",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 border rounded font-mono text-[0.75rem] tracking-wider uppercase ${statusColors[status]} ${className}`}
    >
      <span className={`status-dot animate-pulse-dot ${dotColors[status]}`} />
      {label}
    </span>
  );
}
