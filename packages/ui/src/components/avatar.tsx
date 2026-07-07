import * as React from 'react';
import { cn } from '../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  /** CSS background (gradient or color). */
  background?: string;
  size?: number;
  ring?: boolean;
}

/** Initials avatar with a gradient fallback, matching the design's member chips. */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ initials, background, size = 28, ring = false, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-none items-center justify-center rounded-full font-semibold text-white',
        ring && 'ring-2 ring-bg',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: background ?? 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
        ...style,
      }}
      {...props}
    >
      {initials}
    </div>
  ),
);
Avatar.displayName = 'Avatar';

export interface AvatarStackProps {
  members: Array<{ initials: string; background?: string }>;
  size?: number;
  max?: number;
}

export function AvatarStack({ members, size = 26, max = 4 }: AvatarStackProps) {
  const shown = members.slice(0, max);
  return (
    <div className="flex">
      {shown.map((m, i) => (
        <Avatar
          key={i}
          initials={m.initials}
          background={m.background}
          size={size}
          ring
          style={{ marginLeft: i === 0 ? 0 : -8 }}
        />
      ))}
    </div>
  );
}
