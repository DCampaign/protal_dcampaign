'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const tables = new Set(['projects','tasks','services','reports','approvals','invoices','support','files','team']);

export async function createResourceAction(formData: FormData) {
  const resource = String(formData.get('resource') ?? '');
  if (!tables.has(resource)) throw new Error('Unsupported resource');
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const value = (name: string) => String(formData.get(name) ?? '').trim();
  let table = resource === 'support' ? 'support_tickets' : resource;
  let payload: Record<string, unknown>;
  if (resource === 'services') payload = { name: value('name'), slug: value('slug'), description: value('description') || null };
  else if (resource === 'projects') payload = { title: value('title'), client_id: value('client_id'), status: value('status') || 'planned', description: value('description') || null };
  else if (resource === 'tasks') payload = { title: value('title'), client_id: value('client_id'), project_id: value('project_id') || null, status: value('status') || 'backlog', priority: value('priority') || 'medium' };
  else if (resource === 'reports') payload = { title: value('title'), client_id: value('client_id'), report_type: value('report_type') || 'monthly', status: 'ready' };
  else if (resource === 'approvals') payload = { title: value('title'), client_id: value('client_id'), status: 'pending', description: value('description') || null };
  else if (resource === 'invoices') payload = { invoice_number: value('invoice_number'), client_id: value('client_id'), issue_date: value('issue_date') || new Date().toISOString().slice(0,10), due_date: value('due_date') || null, total: Number(value('total') || 0), subtotal: Number(value('total') || 0), status: 'draft', currency: 'INR' };
  else if (resource === 'support') payload = { subject: value('subject'), client_id: value('client_id'), category: value('category') || 'general', priority: value('priority') || 'normal', status: 'open' };
  else throw new Error('Use the dedicated workflow for this section');
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw new Error(error.message);
  redirect(`/admin/${resource}`);
}
