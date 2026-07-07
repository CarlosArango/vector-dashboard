'use client';

import Link from 'next/link';
import { Clock, DotsThree } from '@phosphor-icons/react';
import { PhIcon } from './ph-icon';
import { Progress } from '@vector/ui/progress';
import { AvatarStack } from '@vector/ui/avatar';
import { formatDue } from '@/lib/format';
import { hexA } from './priority-badge';
import type { ProjectCardVM } from './projects-view';

export function ProjectCard({ card }: { card: ProjectCardVM }) {
  return (
    <Link
      href={`/projects/${card.id}`}
      className="animate-vrise block cursor-pointer rounded-xl border border-border bg-card p-[18px] transition-[border-color,transform] hover:border-border-2 hover:shadow-[0_4px_16px_rgba(0,0,0,0.14)]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px]"
          style={{ background: hexA(card.color, 0.14) }}
        >
          <PhIcon name={card.icon} size={19} style={{ color: card.color }} />
        </div>
        <DotsThree size={18} className="text-muted" />
      </div>
      <div className="mb-0.5 text-[14.5px] font-semibold tracking-tight text-fg">{card.name}</div>
      <div className="mb-4 text-[12.5px] text-muted">{card.description}</div>

      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11.5px] text-muted">
          {card.done} of {card.total} done
        </span>
        <span className="font-mono text-[11.5px] font-semibold text-fg-2">{card.percent}%</span>
      </div>
      <Progress value={card.percent} color={card.color} className="mb-4" />

      <div className="flex items-center justify-between">
        <AvatarStack members={card.avatars} />
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium"
          style={{ color: card.overdue ? '#ef4444' : 'var(--muted)' }}
        >
          <Clock size={12} /> {formatDue(card.dueDate) ?? 'No date'}
        </span>
      </div>
    </Link>
  );
}
