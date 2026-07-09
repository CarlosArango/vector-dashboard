import { BoardSkeleton } from '@/components/board-skeleton';

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
      <BoardSkeleton />
    </>
  );
}
