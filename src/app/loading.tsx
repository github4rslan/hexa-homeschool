import { HexaLogo } from "@/components/ui/hexa-logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <HexaLogo size={48} />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog-500">
          Initialising
        </span>
      </div>
    </div>
  );
}
