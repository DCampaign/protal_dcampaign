import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ResourceConfig = { title: string; description: string; table: string; select: string; order: string; columns: Array<[string, string]> };
const resources: Record<string, ResourceConfig> = {
  projects: { title: 'Projects', description: 'Delivery status across every client organization.', table: 'projects', select: 'id,title,status,progress,due_date,clients(company_name)', order: 'updated_at', columns: [['title', 'Project'], ['client', 'Client'], ['status', 'Status'], ['progress', 'Progress'], ['due_date', 'Due date']] },
  tasks: { title: 'Tasks', description: 'Current operational work and client dependencies.', table: 'tasks', select: 'id,title,status,priority,due_date,clients(company_name)', order: 'updated_at', columns: [['title', 'Task'], ['client', 'Client'], ['status', 'Status'], ['priority', 'Priority'], ['due_date', 'Due date']] },
  services: { title: 'Services', description: 'The service catalogue used for client access and navigation.', table: 'services', select: 'id,name,slug,is_active,display_order', order: 'display_order', columns: [['name', 'Service'], ['slug', 'Slug'], ['is_active', 'Active'], ['display_order', 'Order']] },
  reports: { title: 'Reports', description: 'Published and in-progress performance reporting.', table: 'reports', select: 'id,title,report_type,status,period_end,clients(company_name)', order: 'created_at', columns: [['title', 'Report'], ['client', 'Client'], ['report_type', 'Type'], ['status', 'Status'], ['period_end', 'Period end']] },
  files: { title: 'Files', description: 'Private client documents stored in the secured file bucket.', table: 'files', select: 'id,name,category,mime_type,size_bytes,clients(company_name)', order: 'created_at', columns: [['name', 'File'], ['client', 'Client'], ['category', 'Category'], ['mime_type', 'Type'], ['size_bytes', 'Bytes']] },
  approvals: { title: 'Approvals', description: 'Client decisions waiting for review or already recorded.', table: 'approvals', select: 'id,title,status,due_date,clients(company_name)', order: 'updated_at', columns: [['title', 'Approval'], ['client', 'Client'], ['status', 'Status'], ['due_date', 'Due date']] },
  invoices: { title: 'Invoices', description: 'Billing status across client accounts.', table: 'invoices', select: 'id,invoice_number,status,total,currency,due_date,clients(company_name)', order: 'created_at', columns: [['invoice_number', 'Invoice'], ['client', 'Client'], ['status', 'Status'], ['amount', 'Amount'], ['due_date', 'Due date']] },
  support: { title: 'Support', description: 'Requests submitted by client users.', table: 'support_tickets', select: 'id,subject,status,priority,category,updated_at,clients(company_name)', order: 'updated_at', columns: [['subject', 'Subject'], ['client', 'Client'], ['status', 'Status'], ['priority', 'Priority'], ['category', 'Category']] },
  team: { title: 'Team', description: 'Internal access, roles, and account status.', table: 'profiles', select: 'id,full_name,email,role,is_active,updated_at', order: 'updated_at', columns: [['full_name', 'Name'], ['email', 'Email'], ['role', 'Role'], ['is_active', 'Active']] },
};

function valueFor(row: Record<string, unknown>, key: string) {
  if (key === 'client') { const relation = row.clients; const client = Array.isArray(relation) ? relation[0] : relation; return client && typeof client === 'object' && 'company_name' in client ? String(client.company_name) : '—'; }
  if (key === 'amount') return `${row.currency ?? 'INR'} ${Number(row.total ?? 0).toLocaleString('en-IN')}`;
  if (key === 'progress') return `${row.progress ?? 0}%`;
  const value = row[key];
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value === null || value === undefined || value === '' ? '—' : String(value).replaceAll('_', ' ');
}

export default async function AdminResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const config = resources[resource];
  if (!config) notFound();
  const supabase = await createSupabaseServerClient();
  const queryClient = supabase as unknown as { from(table: string): { select(columns: string): { order(column: string, options: { ascending: boolean }): Promise<{ data: Record<string, unknown>[] | null }> } } } | null;
  const rows = queryClient ? (await queryClient.from(config.table).select(config.select).order(config.order, { ascending: config.order === 'display_order' })).data ?? [] : [];
  return <><p className="text-sm font-extrabold uppercase tracking-widest text-brand">Administration</p><h1 className="mt-3 font-display text-4xl font-extrabold">{config.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-white/50">{config.description}</p>{rows.length ? <div className="mt-8 overflow-hidden rounded-2xl border border-white/8"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-white/45"><tr>{config.columns.map(([, label]) => <th key={label} className="p-4">{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)} className="border-t border-white/8 text-sm">{config.columns.map(([key]) => <td key={key} className="p-4 capitalize text-white/65 first:font-bold first:text-white">{valueFor(row, key)}</td>)}</tr>)}</tbody></table></div></div> : <div className="mt-8 rounded-2xl border border-dashed border-white/12 p-8"><h2 className="font-display text-xl font-bold">Nothing here yet</h2><p className="mt-2 text-base text-white/50">Records will appear as the team begins using this workflow.</p></div>}</>;
}
