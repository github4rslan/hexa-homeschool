import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/5 border border-white/10 text-fog-200",
        violet: "bg-violet-500/10 border border-violet-400/20 text-violet-300",
        neon: "bg-neon-500/10 border border-neon-400/20 text-neon-400",
        cyan: "bg-cyan-500/10 border border-cyan-400/20 text-cyan-400",
        amber: "bg-amber-500/10 border border-amber-400/20 text-amber-400",
        crimson: "bg-crimson-500/10 border border-crimson-400/20 text-crimson-400",
        outline: "border border-white/15 text-fog-300",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[10px]",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  pulse,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </div>
  );
}
