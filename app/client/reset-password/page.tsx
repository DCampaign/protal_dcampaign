'use client';

import { useActionState } from 'react';
import { resetPassword, type ResetState } from './actions';

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, {} as ResetState);
  return <main className="grid min-h-screen place-items-center bg-brand-bg px-6 text-white"><section className="glass-card w-full max-w-md rounded-[1.75rem] p-7 sm:p-10"><p className="text-xs font-extrabold uppercase tracking-widest text-brand">Secure account</p><h1 className="mt-3 font-display text-3xl font-extrabold">Choose a new password.</h1><form action={action} className="mt-8 space-y-5">{['password','confirmPassword'].map((name,index)=><div key={name}><label htmlFor={name} className="mb-2 block text-sm font-bold text-white/70">{index===0?'New password':'Confirm password'}</label><input id={name} name={name} type="password" minLength={8} required autoComplete="new-password" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-brand" /></div>)}{state.error&&<p role="alert" className="text-sm text-red-200">{state.error}</p>}<button disabled={pending} className="h-12 w-full rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider hover:bg-brand-dark disabled:opacity-60">{pending?'Updating…':'Update password'}</button></form></section></main>;
}
