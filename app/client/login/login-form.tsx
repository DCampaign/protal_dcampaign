'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return <form className="space-y-5" action={action}>
    <div><label htmlFor="email" className="mb-2 block text-sm font-bold text-white/70">Work email</label><input id="email" name="email" type="email" autoComplete="email" required className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-brand/70 focus:ring-2 focus:ring-brand/20" placeholder="you@company.com" /></div>
    <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-bold text-white/70">Password</label><a href="/client/forgot-password" className="text-sm font-bold text-brand-light hover:text-white">Forgot password?</a></div><input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-brand/70 focus:ring-2 focus:ring-brand/20" placeholder="Enter your password" /></div>
    {state.error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
    <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_35px_rgba(241,97,51,0.22)] transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60">{pending ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}
