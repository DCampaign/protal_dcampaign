'use client';
import { useState } from 'react';

export function SupportForm() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState('sending');
    try {
      const response = await fetch('/api/support', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject, category, priority, message }) });
      if (!response.ok) throw new Error('Request failed');
      setState('success'); setSubject(''); setMessage('');
    } catch { setState('error'); }
  }
  return <section id="request" className="border-y border-white/8 bg-white/[0.02] px-0 py-10 md:py-14"><div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[.75fr_1.25fr] lg:items-start"><div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">SUBMIT AN ISSUE</p><h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Tell us what’s happening.</h2><p className="mt-4 max-w-md text-sm leading-6 text-white/48">Share enough detail for the team to understand the issue and route it quickly. Client account access may be required to submit.</p></div><form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#121214] p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold sm:col-span-2">Subject<input required value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal outline-none placeholder:text-white/30 focus:border-brand" placeholder="What do you need help with?" /></label><label className="block text-sm font-bold">Issue type<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#151518] px-4 text-sm font-normal outline-none focus:border-brand"><option value="general">General</option><option value="technical">Technical / portal</option><option value="campaign">Campaign delivery</option><option value="billing">Billing / invoice</option><option value="access">Account access</option></select></label><label className="block text-sm font-bold">Priority<select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#151518] px-4 text-sm font-normal outline-none focus:border-brand"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="block text-sm font-bold sm:col-span-2">Describe the issue<textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm font-normal outline-none placeholder:text-white/30 focus:border-brand" placeholder="Include the project, service, deadline, and any useful links or screenshots." /></label></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><button disabled={state === 'sending'} className="min-h-12 rounded-xl bg-brand px-6 text-sm font-extrabold transition hover:bg-brand-dark disabled:opacity-50">{state === 'sending' ? 'Sending…' : 'Submit request'}</button>{state === 'success' && <p className="text-sm font-semibold text-emerald-300">Request submitted successfully.</p>}{state === 'error' && <p className="text-sm font-semibold text-red-300">Please sign in through the client portal before submitting.</p>}</div></form></div></section>;
}



