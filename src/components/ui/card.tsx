import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  [
    "relative overflow-hidden rounded-2xl transition-all duration-500",
  ],
  {
    variants: {
      variant: {
        glass: "glass",
        "glass-strong": "glass-strong",
        violet: "glass-violet",
        solid: "bg-nebula border border-white/5",
        outline: "border border-white/10 bg-transparent",
      },
      interactive: {
        true: "hover:scale-[1.015] hover:border-white/15 cursor-pointer group",
        false: "",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "glass",
      interactive: false,
      padding: "md",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  glow?: "violet" | "neon" | "cyan" | "none";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant, interactive, padding, glow = "none", children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, interactive, padding }),
          glow === "violet" && "hover:glow-violet",
          glow === "neon" && "hover:glow-neon",
          glow === "cyan" && "hover:glow-cyan",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight text-fog-50",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-relaxed text-fog-300", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex items-center gap-3", className)}
      {...props}
    />
  );
}
