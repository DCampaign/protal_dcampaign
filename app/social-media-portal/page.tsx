import { CalendarDays, CheckCircle2, Clock3, Send } from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';

const cards = [
  { icon: CalendarDays, title: 'Content calendar', text: 'Plan posts across every active channel.' },
  { icon: Send, title: 'Publishing queue', text: 'Queue posts, reels, and stories ahead of time.' },
  { icon: Clock3, title: 'Approval flow', text: 'Keep client approvals moving.' },
] as const;

export default function SocialMediaSchedulerPage() {
  return <main className="min-h-screen bg-brand-bg text-white"><PortalHeader solid /><section className="mx-auto max-w-7xl px-6 pb-16 pt-32 md:px-12"><p className="text-xs font-extrabold uppercase tracking-[0.28em] text-brand">DCAMPAIGN WORKSPACE</p><div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Social media scheduler.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/65">Plan, publish, and monitor social content from one focused workspace.</p></div><button className="rounded border border-brand bg-brand px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white">Create post</button></div><div className="mt-10 grid gap-4 md:grid-cols-3">{cards.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-white/10 bg-[#171719] p-6"><span className="grid size-11 place-items-center rounded-2xl bg-[#2a1711] text-brand-light"><Icon size={21} /></span><p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">{title}</p><p className="mt-3 text-sm leading-6 text-white/60">{text}</p></div>)}</div><div className="mt-6 rounded-3xl border border-white/10 bg-[#111113] p-6"><div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-brand" /><p className="text-sm font-bold">Your scheduler is ready for setup.</p></div></div></section></main>;
}
