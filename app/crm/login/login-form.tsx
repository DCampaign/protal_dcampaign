'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { crmLoginAction, type CrmLoginState } from '../actions';

const initialState: CrmLoginState = {};

export function CrmLoginForm() {
  const [state, action, pending] = useActionState(crmLoginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  return <form action={action} onSubmit={() => sessionStorage.removeItem('dcampaign-crm-session-started')} className="mt-8 space-y-5">
    <label className="block"><span className="mb-2 block text-sm font-bold text-white/70">Work email</span><span className="flex h-13 items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 focus-within:border-brand/70 focus-within:ring-2 focus-within:ring-brand/15"><Mail size={18} className="text-white/35"/><input name="email" type="email" autoComplete="email" required placeholder="you@dcampaign.com" className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"/></span></label>
    <label className="block"><span className="mb-2 block text-sm font-bold text-white/70">Password</span><span className="flex h-13 items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 focus-within:border-brand/70 focus-within:ring-2 focus-within:ring-brand/15"><LockKeyhole size={18} className="text-white/35"/><input name="password" type={showPassword?'text':'password'} autoComplete="current-password" minLength={8} required placeholder="Enter your password" className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(value=>!value)} className="text-white/45 hover:text-white">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
    {state.error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
    <button disabled={pending} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand text-xs font-extrabold uppercase tracking-[.14em] text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60">{pending ? 'Signing in…' : 'Sign in to CRM'}<ArrowRight size={17}/></button>
  </form>;
}
