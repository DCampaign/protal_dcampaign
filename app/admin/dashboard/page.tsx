import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function CountCard({ label, value, href }: { label: string; value: number; href: string }) { return <Link href={href} className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 transition hover:border-brand/35"><p className="text-sm font-extrabold uppercase tracking-wider text-white/45">{label}</p><p className="mt-3 font-display text-3xl font-extrabold">{value}</p></Link>; }

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const [clients, projects, tasks, approvals, tickets, invoices] = supabase ? await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).in('status', ['onboarding', 'active', 'paused']),
    supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['planned', 'active', 'on_hold', 'awaiting_client']),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['planned', 'in_progress', 'blocked', 'awaiting_client']),
    supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'awaiting_client']),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['issued', 'overdue']),
  ]) : [] as never;
  const counts = [clients?.count ?? 0, projects?.count ?? 0, tasks?.count ?? 0, approvals?.count ?? 0, tickets?.count ?? 0, invoices?.count ?? 0];
  return <><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-extrabold uppercase tracking-widest text-brand">Admin dashboard</p><h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Operations, clearly managed.</h1><p className="mt-3 text-base text-white/50">Monitor client delivery and respond to the items that need attention.</p></div><Link href="/admin/clients/new" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 text-sm font-extrabold hover:bg-brand-dark">Add client</Link></div><div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><CountCard label="Active clients" value={counts[0]} href="/admin/clients" /><CountCard label="Open projects" value={counts[1]} href="/admin/projects" /><CountCard label="Current tasks" value={counts[2]} href="/admin/tasks" /><CountCard label="Pending approvals" value={counts[3]} href="/admin/approvals" /><CountCard label="Support queue" value={counts[4]} href="/admin/support" /><CountCard label="Open invoices" value={counts[5]} href="/admin/invoices" /></div><section className="mt-8 rounded-3xl border border-white/8 bg-white/[0.025] p-6 sm:p-8"><p className="text-sm font-extrabold uppercase tracking-widest text-brand">Start here</p><h2 className="mt-2 font-display text-2xl font-extrabold">Build a client workspace</h2><p className="mt-3 max-w-2xl text-base leading-7 text-white/50">Create the organization, assign its services, invite the client user, and then add projects and reporting data. Client navigation updates automatically from assigned services.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/admin/clients/new" className="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-black">Create client</Link><Link href="/admin/services" className="min-h-11 rounded-xl border border-white/12 px-5 py-3 text-sm font-extrabold">Manage services</Link></div></section></>;
}
