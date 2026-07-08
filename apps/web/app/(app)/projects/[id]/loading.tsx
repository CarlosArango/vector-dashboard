const COLUMNS = ['Backlog', 'Todo', 'In Progress', 'Done'];

export default function ProjectLoading() {
  return (
    <>
      <header className="flex h-[57px] flex-none items-center justify-between gap-4 border-b border-border px-6">
        <div className="flex items-center gap-2.5">
          <span className="h-[11px] w-[11px] rounded-[4px] bg-card-2" />
          <span className="h-4 w-40 animate-pulse rounded bg-card-2" />
        </div>
        <div className="flex items-center gap-2">
          <span className="h-[34px] w-[190px] animate-pulse rounded bg-card-2" />
          <span className="h-[34px] w-[120px] animate-pulse rounded bg-card-2" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden px-6 py-[18px]">
        <div className="flex h-full min-w-min gap-4">
          {COLUMNS.map((label) => (
            <div
              key={label}
              className="flex h-full w-[288px] flex-none flex-col rounded-xl border border-border bg-bg-2 p-2.5"
            >
              <div className="flex items-center gap-2 px-1 pb-3 pt-0.5">
                <span className="h-2 w-2 rounded-[3px] bg-card-2" />
                <span className="text-[12.5px] font-semibold tracking-tight text-muted">{label}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[76px] animate-pulse rounded-[10px] border border-border bg-card"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
