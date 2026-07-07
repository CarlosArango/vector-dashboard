'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, EnvelopeSimple, Lock } from '@phosphor-icons/react';
import { Button } from '@vector/ui/button';
import { Input } from '@vector/ui/input';
import { Label } from '@vector/ui/label';
import { getBrowserSupabase } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    const credentials = { email: email.trim(), password };
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace('/projects');
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(600px 400px at 50% -10%, var(--primary-soft), transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(closest-side at 50% 40%,#000,transparent)',
        }}
      />

      <div className="animate-vpop relative w-full max-w-[400px]">
        <div className="mb-[30px] flex items-center justify-center gap-[11px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-primary shadow-[0_4px_16px_var(--primary-soft)]">
            <div className="h-[11px] w-[11px] rotate-45 rounded-[2px] bg-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-fg">Vector</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-[0_8px_40px_rgba(0,0,0,0.24)]">
          <h1 className="mb-1.5 text-xl font-semibold tracking-tight text-fg">
            {mode === 'signin' ? 'Sign in to Vector' : 'Create your account'}
          </h1>
          <p className="mb-[22px] text-[13.5px] text-muted">
            {mode === 'signin'
              ? 'Welcome back. Enter your email and password.'
              : 'Start tracking work in minutes — no credit card.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Label className="mb-1.5" htmlFor="email">
              Email address
            </Label>
            <div className="relative mb-3.5">
              <EnvelopeSimple size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-[34px]"
              />
            </div>

            <Label className="mb-1.5" htmlFor="password">
              Password
            </Label>
            <div className="relative mb-3.5">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-[34px]"
              />
            </div>

            {error && <p className="mb-3 text-[12.5px] text-red-400">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight weight="bold" size={14} />}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="cursor-pointer font-medium text-primary"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}
