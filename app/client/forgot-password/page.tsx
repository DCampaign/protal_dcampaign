'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState } from 'react';
import { requestRecovery, type RecoveryState } from './actions';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestRecovery, {} as RecoveryState);
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-bg px-6 py-12 text-white"><div className="hero-grid pointer-events-none absolute inset-0 opacity-30"/><div className="relative z-10 w-full max-w-md"><Link href="/" className="mb-10 flex justify-center"><Image src="/dcampaign-logo-white.webp" alt="DCampaign" width={167} height={32} className="h-9 w-auto" /></Link><section className="glass-card rounded-[1.75rem] p-7 sm:p-10"><p className="text-xs font-extrabold uppercase tracking-widest text-brand">Account recovery</p><h1 className="mt-3 font-display text-3xl font-extrabold">Reset your password.</h1><p className="mt-2 text-base leading-7 text-white/50">Enter your work email and we’ll send a secure recovery link.</p><form action={action} className="mt-8 space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-bold text-white/70">Work email</label><input id="email" name="email" type="email" autoComplete="email" required className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-brand" /></div>{state.error&&<p role="alert" className="text-sm text-red-200">{state.error}</p>}{state.success&&<p role="status" className="text-sm text-emerald-300">{state.success}</p>}<button disabled={pending} className="h-12 w-full rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider hover:bg-brand-dark disabled:opacity-60">{pending?'Sending…':'Send reset link'}</button></form></section><Link href="/client/login" className="mt-6 block text-center text-sm font-bold text-white/45 hover:text-brand-light">← Back to sign in</Link></div></main>;
}
