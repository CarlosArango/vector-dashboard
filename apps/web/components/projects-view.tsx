'use client';

import * as React from 'react';
import { FolderDashed, Plus } from '@phosphor-icons/react';
import { Button } from '@vector/ui/button';
import { Badge } from '@vector/ui/badge';
import { Skeleton } from '@vector/ui/skeleton';
import { SegmentedControl } from '@vector/ui/segmented-control';
import { ProjectCard } from './project-card';
import { NewProjectDialog } from './new-project-dialog';
import type { AvatarVM } from '@/lib/view-models';

export interface ProjectCardVM {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  dueDate: string | null;
  overdue: boolean;
  done: number;
  total: number;
  percent: number;
  avatars: AvatarVM[];
}

type DemoState = 'live' | 'loading' | 'empty';

export function ProjectsView({ cards }: { cards: ProjectCardVM[] }) {
  const [state, setState] = React.useState<DemoState>('live');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // A genuinely empty workspace shows the empty state, not a blank grid.
  const showEmpty = state === 'empty' || (state === 'live' && cards.length === 0);
  const showLive = state === 'live' && cards.length > 0;

  return (
    <>
      <header className="flex h-[57px] flex-none items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[15px] font-semibold tracking-tight">Projects</h1>
          <Badge>{cards.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl<DemoState>
            value={state}
            onValueChange={setState}
            options={[
              { value: 'live', label: 'Live' },
              { value: 'loading', label: 'Loading' },
              { value: 'empty', label: 'Empty' },
            ]}
          />
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={13} weight="bold" /> New Project
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {showLive && (
          <div className="grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-4">
            {cards.map((card) => (
              <ProjectCard key={card.id} card={card} />
            ))}
          </div>
        )}

        {state === 'loading' && (
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
        )}

        {showEmpty && (
          <div className="animate-vfade mx-auto mt-[8vh] max-w-[440px] text-center">
            <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-2xl border border-border bg-card">
              <FolderDashed size={28} className="text-muted" />
            </div>
            <h2 className="mb-2 text-[17px] font-semibold tracking-tight">No projects yet</h2>
            <p className="mb-6 text-[13.5px] leading-relaxed text-muted">
              Projects group your tickets into boards. Create your first one to start tracking work.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={14} weight="bold" /> New Project
            </Button>
          </div>
        )}
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
