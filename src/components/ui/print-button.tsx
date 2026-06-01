"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Triggers the browser print dialog (for CNIS pre-fill / portfolio). */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
