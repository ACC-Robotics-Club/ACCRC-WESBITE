import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#141210] font-mono">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-[#f6f0e7] border-[1.5px] border-[#cfc9bc] text-[#141210] rounded px-4 py-3 text-[0.9375rem] transition-all duration-200 placeholder:text-[#6b6258] focus:border-[#c94030] focus:shadow-[0_0_0_3px_rgba(201,64,48,0.12)] focus:outline-none ${
          error ? "border-[#c72c2c] focus:border-[#c72c2c] focus:shadow-[0_0_0_3px_rgba(199,44,44,0.12)]" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[#c72c2c] text-[0.8125rem]">{error}</span>}
      {hint && !error && <span className="text-[#3a3530] text-[0.8125rem]">{hint}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = "", id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#141210] font-mono">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`bg-[#f6f0e7] border-[1.5px] border-[#cfc9bc] text-[#141210] rounded px-4 py-3 text-[0.9375rem] transition-all duration-200 placeholder:text-[#6b6258] focus:border-[#c94030] focus:shadow-[0_0_0_3px_rgba(201,64,48,0.12)] focus:outline-none resize-y min-h-[120px] ${
          error ? "border-[#c72c2c] focus:border-[#c72c2c] focus:shadow-[0_0_0_3px_rgba(199,44,44,0.12)]" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[#c72c2c] text-[0.8125rem]">{error}</span>}
      {hint && !error && <span className="text-[#3a3530] text-[0.8125rem]">{hint}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = "", id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-[#141210] font-mono">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`bg-[#f6f0e7] border-[1.5px] border-[#cfc9bc] text-[#141210] rounded px-4 py-3 text-[0.9375rem] transition-all duration-200 focus:border-[#c94030] focus:shadow-[0_0_0_3px_rgba(201,64,48,0.12)] focus:outline-none appearance-none cursor-pointer ${
          error ? "border-[#c72c2c]" : ""
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-[#c72c2c] text-[0.8125rem]">{error}</span>}
    </div>
  );
}
