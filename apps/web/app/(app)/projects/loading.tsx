import { Skeleton } from '@vector/ui/skeleton';

export default function ProjectsLoading() {
  return (
    <>
      <header className="flex h-[57px] flex-none items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[15px] font-semibold tracking-tight">Projects</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-[18px]">
              <Skeleton className="mb-4 h-[38px] w-[38px] rounded-[10px]" />
              <Skeleton className="mb-2.5 h-3 w-3/5" />
              <Skeleton className="mb-5 h-2.5 w-[85%]" />
              <Skeleton className="mb-4 h-1.5 w-full" />
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
