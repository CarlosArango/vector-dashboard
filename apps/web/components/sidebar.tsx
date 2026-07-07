'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  CaretLeft,
  CaretRight,
  CaretUpDown,
  CheckSquareOffset,
  GearSix,
  Moon,
  Plus,
  SignOut,
  SquaresFour,
  SunDim,
  Tray,
} from '@phosphor-icons/react';
import { cn } from '@vector/ui/lib/utils';
import { Avatar } from '@vector/ui/avatar';
import { signOut } from '@/app/actions/auth';

export interface SidebarProject {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface AppSidebarProps {
  workspaceName: string;
  workspacePlan: string;
  projects: SidebarProject[];
  user: { name: string; email: string; initials: string; color: string };
}

const NAV = [
  { href: '/projects', icon: SquaresFour, label: 'Projects', exact: true },
  { href: '/my-tickets', icon: CheckSquareOffset, label: 'My Tickets', exact: false },
  { href: '/inbox', icon: Tray, label: 'Inbox', exact: false },
];

export function AppSidebar({ workspaceName, workspacePlan, projects, user }: AppSidebarProps) {
  const [open, setOpen] = React.useState(true);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const dark = theme !== 'light';

  return (
    <aside
      className="relative flex flex-none flex-col border-r border-border bg-bg-2 transition-[width] duration-200"
      style={{ width: open ? 244 : 62 }}
    >
      {/* workspace switcher */}
      <div className="px-3 pb-2.5 pt-3.5">
        <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-card-2">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-primary">
            <div className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-white" />
          </div>
          {open && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-[13.5px] font-semibold tracking-tight text-fg">
                  {workspaceName}
                </div>
                <div className="text-[11px] text-muted">{workspacePlan}</div>
              </div>
              <CaretUpDown size={14} className="text-muted" />
            </>
          )}
        </button>
      </div>
      <div className="mx-3 mb-2 mt-0.5 h-px bg-border" />

      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href || pathname.startsWith('/projects')
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium hover:bg-card-2',
                active ? 'bg-card-2 text-fg' : 'text-fg-2',
              )}
            >
              <Icon size={17} weight={active ? 'bold' : 'regular'} className="w-[18px] flex-none" />
              {open && <span className="text-[13px]">{item.label}</span>}
            </Link>
          );
        })}

        {open && (
          <div className="flex items-center justify-between px-2.5 pb-1.5 pt-4">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
              Projects
            </span>
            <Plus size={12} weight="bold" className="cursor-pointer text-muted" />
          </div>
        )}
        {projects.map((p) => {
          const active = pathname.startsWith(`/projects/${p.id}`);
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={cn(
                'mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-card-2',
                active ? 'bg-card-2 text-fg' : 'text-fg-2',
              )}
            >
              <span
                className="h-2.5 w-2.5 flex-none rounded-[3px]"
                style={{ background: p.color }}
              />
              {open && (
                <>
                  <span className="flex-1 truncate text-[13px] font-medium">{p.name}</span>
                  <span className="font-mono text-[11px] text-muted">{p.count}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* footer */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-fg-2 hover:bg-card-2"
        >
          {dark ? (
            <SunDim size={17} className="w-[18px] flex-none" />
          ) : (
            <Moon size={17} className="w-[18px] flex-none" />
          )}
          {open && <span className="text-[13px] font-medium">{dark ? 'Light mode' : 'Dark mode'}</span>}
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-fg-2 hover:bg-card-2">
          <GearSix size={17} className="w-[18px] flex-none" />
          {open && <span className="text-[13px] font-medium">Settings</span>}
        </button>

        <div className="mx-0.5 my-1.5 h-px bg-border" />

        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar initials={user.initials} background={user.color} size={28} />
          {open && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-fg">{user.name}</div>
                <div className="truncate text-[11px] text-muted">{user.email}</div>
              </div>
              <form action={signOut}>
                <button type="submit" title="Sign out" className="flex text-muted hover:text-fg">
                  <SignOut size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* collapse toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute -right-[11px] top-[62px] z-[5] flex h-[22px] w-[22px] items-center justify-center rounded-full border border-border bg-card hover:bg-card-2"
      >
        {open ? (
          <CaretLeft size={13} weight="bold" className="text-muted" />
        ) : (
          <CaretRight size={13} weight="bold" className="text-muted" />
        )}
      </button>
    </aside>
  );
}
