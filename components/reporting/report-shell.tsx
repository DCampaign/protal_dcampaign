import Link from 'next/link';
import type { ReactNode } from 'react';

export function ReportShell({ kicker, title, description, children }: { kicker: string; title: string; description: string; children: ReactNode }) {
  return <main className="min-h-screen bg-brand-bg px-6 pb-20 pt-28 text-white md:px-12"><div className="mx-auto max-w-7xl"><Link href="/client/dashboard" className="text-xs font-bold uppercase tracking-widest text-brand-light hover:text-white">← Dashboard</Link><div className="mt-10 border-b border-white/10 pb-8"><p className="text-xs font-extrabold uppercase tracking-widest text-brand">{kicker}</p><h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">{description}</p></div>{children}</div></main>;
}

export function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) { return <div className="glass-card rounded-2xl p-5"><p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-white/40">{label}</p><p className="mt-3 font-display text-2xl font-extrabold">{value}</p>{detail && <p className="mt-1 text-xs text-emerald-300">{detail}</p>}</div>; }

export function EmptyReport({ message = 'Your team has not entered reporting data for this period yet.' }: { message?: string }) { return <div className="glass-card mt-6 rounded-2xl p-7 text-sm leading-7 text-white/45">{message}</div>; }
