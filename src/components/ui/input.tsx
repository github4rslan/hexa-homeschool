import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wider text-fog-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog-500">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full h-12 rounded-xl bg-white/[0.03] border border-white/10",
              // 16px on touch screens so iOS doesn't zoom-on-focus; 14px from sm: up.
              "px-4 py-3 text-base sm:text-sm text-fog-50 placeholder:text-fog-500",
              "transition-all duration-200",
              "focus:bg-white/[0.05] focus:border-violet-400/60",
              "focus:outline-none focus:ring-2 focus:ring-violet-400/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-crimson-400/60 focus:border-crimson-400 focus:ring-crimson-400/20",
              leftIcon && "pl-11",
              className,
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="text-xs text-fog-500">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-crimson-400">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
