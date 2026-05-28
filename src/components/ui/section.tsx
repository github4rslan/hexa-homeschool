import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "./container";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  padded?: boolean;
}

export function Section({
  className,
  containerSize = "xl",
  padded = true,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative",
        padded && "py-24 md:py-32",
        className,
      )}
      {...props}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center mx-auto max-w-3xl",
        align === "left" && "items-start text-left max-w-3xl",
        className,
      )}
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/5 px-4 py-1.5 text-xs font-medium tracking-wide text-violet-300 uppercase">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
          </span>
          {eyebrow}
        </div>
      )}
      <h2 className="text-4xl font-semibold tracking-tight text-fog-50 md:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p className="text-lg leading-relaxed text-fog-300 md:text-xl max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
