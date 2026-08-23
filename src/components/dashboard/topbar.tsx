import { Bell, Search } from "lucide-react";

export function DashboardTopbar({ greeting }: { greeting?: string }) {
  return (
    <header className="h-16 border-b border-white/5 bg-abyss/70 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-fog-500">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Europe/London",
          })}
        </span>
        {greeting && (
          <h1 className="text-base font-semibold text-fog-50">{greeting}</h1>
        )}
      </div>
      {/* Placeholder utilities hidden on mobile so the floating menu trigger
          (top-right) has room and nothing overlaps. */}
      <div className="hidden lg:flex items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-fog-300 hover:text-fog-50 transition-all"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-fog-300 hover:text-fog-50 transition-all"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-neon-400" />
        </button>
      </div>
    </header>
  );
}
