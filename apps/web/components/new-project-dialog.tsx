'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectValues } from '@vector/validation';
import { Button } from '@vector/ui/button';
import { Input } from '@vector/ui/input';
import { Label } from '@vector/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@vector/ui/dialog';
import { cn } from '@vector/ui/lib/utils';
import { createProjectAction } from '@/app/actions/projects';
import { PROJECT_ICON_OPTIONS, PhIcon } from './ph-icon';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export function NewProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { color: COLORS[0], icon: PROJECT_ICON_OPTIONS[0]!.value, memberIds: [] },
  });

  const color = watch('color');
  const icon = watch('icon');

  async function onSubmit(values: CreateProjectValues) {
    setServerError(null);
    const result = await createProjectAction(values);
    if (!result.ok) {
      setServerError(result.error ?? 'Something went wrong');
      return;
    }
    reset();
    onOpenChange(false);
    router.refresh();
    if (result.data) router.push(`/projects/${result.data.id}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          reset();
          setServerError(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Group tickets into a board and start tracking work.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <Label className="mb-1.5">Name</Label>
            <Input placeholder="Atlas Web App" {...register('name')} />
            {errors.name && <p className="mt-1 text-[12px] text-red-400">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div>
              <Label className="mb-1.5">Description</Label>
              <Input placeholder="Core dashboard & auth" {...register('description')} />
            </div>
            <div>
              <Label className="mb-1.5">Key</Label>
              <Input placeholder="ATL" maxLength={6} {...register('key')} />
            </div>
          </div>
          {errors.key && <p className="text-[12px] text-red-400">{errors.key.message}</p>}

          <div>
            <Label className="mb-2">Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={cn(
                    'h-7 w-7 rounded-lg transition-transform',
                    color === c && 'ring-2 ring-offset-2 ring-offset-card',
                  )}
                  style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2">Icon</Label>
            <div className="flex gap-2">
              {PROJECT_ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('icon', opt.value)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border',
                    icon === opt.value
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border bg-card-2 text-fg-2',
                  )}
                >
                  <PhIcon name={opt.value} size={18} />
                </button>
              ))}
            </div>
          </div>

          {serverError && <p className="text-[12.5px] text-red-400">{serverError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="subtle" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
