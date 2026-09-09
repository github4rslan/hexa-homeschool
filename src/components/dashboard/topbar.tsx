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
      {/* B3: the Search and Notifications buttons were removed here — both
          were non-functional placeholders (Search did nothing on click,
          Notifications showed a permanently-on fake unread dot with no real
          panel behind it), which is worse than no control at all. Reinstate
          only once each is a genuinely working feature. */}
    </header>
  );
}
