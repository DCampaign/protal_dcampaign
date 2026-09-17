import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, isCrmRole } from '@/lib/auth/permissions';
import { crmWorkspaceSchema } from '@/lib/crm/workspace-schema';
import type { Account, PortalData, PortalEvent, PortalRecord } from './schema';

export class PortalError extends Error { constructor(message:string, public status=400) { super(message); } }
export async function portalActor() {
  const auth = await createSupabaseServerClient();
  if (!auth) throw new PortalError('Authentication is not configured.',503);
  const {data:{user}} = await auth.auth.getUser();
  if (!user) throw new PortalError('Please sign in.',401);
  const admin = createSupabaseAdminClient();
  const {data:profile,error} = await admin.from('profiles').select('id,full_name,email,role,is_active').eq('user_id',user.id).maybeSingle();
  if (error || !profile?.is_active) throw new PortalError('Your account is disabled or unavailable.',403);
  if (!isCrmRole(profile.role) && profile.role !== 'client') throw new PortalError('Access denied.',403);
  return {admin,profile,employee:isCrmRole(profile.role)};
}
export type Actor = Awaited<ReturnType<typeof portalActor>>;
export async function crmClients(ctx:Actor) {
  const {data,error} = await ctx.admin.from('crm_workspace_state').select('payload').eq('id','primary').maybeSingle();
  if (error) throw new PortalError('Unable to read CRM records.',503);
  const parsed = crmWorkspaceSchema.safeParse(data?.payload);
  if (!parsed.success) throw new PortalError('CRM records are not ready. Ask your administrator to check the workspace.',503);
  return parsed.data;
}
export async function portalContext(requested?:string|null) {
  const ctx=await portalActor();
  let query=ctx.admin.from('portal_accounts').select('id,crm_client_id,is_active,manager_id');
  let lastRead:string|null=null;
  if (!ctx.employee) {
    const {data:member,error}=await ctx.admin.from('portal_members').select('account_id,is_active,last_read_at').eq('profile_id',ctx.profile.id).maybeSingle();
    if (error) throw new PortalError('Client portal database setup is required.',503);
    if (!member?.is_active || requested && requested!==member.account_id) throw new PortalError('Portal access is not available.',403);
    query=query.eq('id',member.account_id).eq('is_active',true);lastRead=member.last_read_at;
  } else if (!isAdminRole(ctx.profile.role)) query=query.eq('manager_id',ctx.profile.id);
  const {data:accountRows,error}=await query;
  if (error) throw new PortalError('Client portal database setup is required.',503);
  const workspace=await crmClients(ctx);
  const clients=workspace.clients.filter(c=>!c.archivedAt && (!c.sourceLeadId || workspace.leads.some(l=>l.id===c.sourceLeadId && l.status==='Won' && !l.archivedAt)));
  const accounts:Account[]=(accountRows||[]).flatMap(a=>{const c=clients.find(c=>c.id===a.crm_client_id);return c?[{...a,company:c.company}]:[];});
  const account=requested?accounts.find(a=>a.id===requested):accounts[0];
  if ((requested || !ctx.employee) && !account) throw new PortalError('Portal access is not available.',403);
  return {...ctx,workspace,clients,accounts,account:account||null,lastRead};
}
export async function portalData(requested?:string|null):Promise<PortalData> {
  const ctx=await portalContext(requested), {admin,profile,employee,account}=ctx;
  const base:PortalData={employee,canManage:employee && (isAdminRole(profile.role)||['account_manager','team_member'].includes(profile.role)),canInvite:isAdminRole(profile.role),name:profile.full_name,account,accounts:ctx.accounts,records:[],events:[],members:[],managers:[],clients:[],profile:{name:'',email:'',phone:'',website:'',address:''},services:[],payments:[],manager:null,lastRead:ctx.lastRead};
  if (isAdminRole(profile.role)) {
    base.clients=ctx.clients.map(c=>({id:c.id,company:c.company}));
    const {data,error}=await admin.from('profiles').select('id,full_name').eq('is_active',true).in('role',['super_admin','admin','account_manager','team_member']);
    if(error)throw new PortalError('Unable to load account managers.',503);
    base.managers=(data||[]).map(p=>({id:p.id,name:p.full_name}));
  }
  if (!account) return base;
  let recordsQuery=admin.from('portal_records').select('*').eq('account_id',account.id).order('updated_at',{ascending:false});
  let eventsQuery=admin.from('portal_events').select('*').eq('account_id',account.id).order('created_at',{ascending:false});
  if (!employee) { recordsQuery=recordsQuery.eq('visible',true);eventsQuery=eventsQuery.eq('visible',true); }
  const [records,events]=await Promise.all([recordsQuery,eventsQuery]);
  if(records.error||events.error)throw new PortalError('Unable to load client work.',503);
  base.records=(records.data||[]) as PortalRecord[];
  const visibleIds=new Set(base.records.map(r=>r.id));
  base.events=((events.data||[]) as PortalEvent[]).filter(e=>visibleIds.has(e.record_id));
  const client=ctx.clients.find(c=>c.id===account.crm_client_id);
  if(client){
    const lead=ctx.workspace.leads.find(l=>l.id===client.sourceLeadId),prospect=ctx.workspace.prospects.find(p=>p.id===lead?.sourceProspectId);
    base.profile={name:prospect?.contactPerson||lead?.name||client.name,email:prospect?.email||lead?.email||client.email||'',phone:prospect?.phone||lead?.phone||client.phone,website:prospect?.website||lead?.website||client.website||'',address:prospect?.address||lead?.address||client.address||'',...client.portalContact};
    base.services=client.serviceItems?.length?client.serviceItems.map(s=>({name:s.name,status:s.status,start:client.start})):client.services.split(',').filter(Boolean).map(name=>({name:name.trim(),status:client.status,start:client.start}));
    base.payments=ctx.workspace.payments.filter(p=>p.sourceClientId===client.id&&!p.archivedAt).map(p=>({id:p.id,service:p.service,amount:p.amount,paidAmount:p.status==='Paid'?p.amount:(p.paidAmount||0),due:p.due,paid:p.paid,status:p.status,method:p.method}));
  }
  if(account.manager_id){const {data}=await admin.from('profiles').select('full_name,email').eq('id',account.manager_id).eq('is_active',true).maybeSingle();if(data)base.manager={name:data.full_name,email:data.email};}
  if(base.canInvite){
    const {data,error}=await admin.from('portal_members').select('id,profile_id,is_active,profiles(full_name,email)').eq('account_id',account.id);
    if(error)throw new PortalError('Unable to load portal members.',503);
    base.members=(data||[]).map(m=>{const p=Array.isArray(m.profiles)?m.profiles[0]:m.profiles;return {id:m.id,profile_id:m.profile_id,is_active:m.is_active,name:p?.full_name||'',email:p?.email||''};});
  }
  return base;
}
