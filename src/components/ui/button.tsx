import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2",
    "font-medium tracking-tight whitespace-nowrap",
    "transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
    "disabled:pointer-events-none disabled:opacity-50",
    "overflow-hidden group",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-br from-violet-500 to-violet-700 text-white",
          "shadow-[0_0_40px_-10px_rgba(124,58,237,0.6),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
          "hover:shadow-[0_0_60px_-10px_rgba(124,58,237,0.9),inset_0_1px_0_0_rgba(255,255,255,0.2)]",
          "hover:scale-[1.02] active:scale-[0.98]",
        ],
        secondary: [
          "glass-strong text-fog-50",
          "hover:bg-white/10 hover:border-white/20",
        ],
        ghost: [
          "text-fog-200 hover:text-fog-50 hover:bg-white/5",
        ],
        outline: [
          "border border-violet-400/30 text-fog-50 bg-violet-500/5",
          "hover:border-violet-400/60 hover:bg-violet-500/10",
        ],
        neon: [
          "bg-neon-500/10 border border-neon-400/30 text-neon-400",
          "shadow-[0_0_30px_-10px_rgba(6,255,165,0.5)]",
          "hover:bg-neon-500/15 hover:border-neon-400/60 hover:shadow-[0_0_50px_-10px_rgba(6,255,165,0.8)]",
        ],
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-lg",
        md: "h-11 px-6 text-sm rounded-xl",
        lg: "h-14 px-8 text-base rounded-2xl",
        xl: "h-16 px-10 text-lg rounded-2xl",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  href?: string;
  external?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, href, external, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    const content = (
      <>
        {/* Sheen overlay for primary buttons */}
        {variant === "primary" && (
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </>
    );

    if (href) {
      return external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {content}
        </a>
      ) : (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {content}
      </button>
    );
  },
);
Button.displayName = "Button";
