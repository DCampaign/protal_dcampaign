'use client';

import { useActionState, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

export function LoginForm({ destination }: { destination?: 'client-portal' }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [mode, setMode] = useState<'client' | 'employee'>('client');
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest('button');
      if (!button) return;
      if (button.textContent?.toLowerCase().includes('employee login')) setMode('employee');
      if (button.textContent?.toLowerCase().includes('client login')) setMode('client');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return <form className="space-y-5" action={action}><input type="hidden" name="loginMode" value={mode} readOnly />{destination&&<input type="hidden" name="destination" value={destination} readOnly />}
    <div><label htmlFor="email" className="mb-2 block text-sm font-bold text-white/70">Work email</label><input id="email" name="email" type="email" autoComplete="email" required className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-brand/70 focus:ring-2 focus:ring-brand/20" placeholder="you@company.com" /></div>
    <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-bold text-white/70">Password</label><a href="/client/forgot-password" className="text-sm font-bold text-brand-light hover:text-white">Forgot password?</a></div><span className="flex h-12 items-center rounded-xl border border-white/10 bg-white/5 transition focus-within:border-brand/70 focus-within:ring-2 focus-within:ring-brand/20"><input id="password" name="password" type={showPassword?'text':'password'} autoComplete="current-password" required minLength={8} className="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-white outline-none placeholder:text-white/25" placeholder="Enter your password" /><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(value=>!value)} className="mr-3 text-white/45 hover:text-white">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></div>
    {state.error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
    <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_35px_rgba(241,97,51,0.22)] transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60">{pending ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}



