import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isCrmRole } from '@/lib/auth/permissions';
import { crmWorkspaceSchema } from '@/lib/crm/workspace-schema';

export const dynamic = 'force-dynamic';

async function getContext() {
  const auth = await createSupabaseServerClient();
  if (!auth) return null;
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from('profiles').select('id,role,is_active,full_name').eq('user_id',user.id).maybeSingle();
  return profile?.is_active && isCrmRole(profile.role) ? { admin, profile } : null;
}

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data,error} = await ctx.admin.from('crm_workspace_state').select('payload,version,updated_at').eq('id','primary').maybeSingle();
  if (error) return NextResponse.json({error:'CRM database migration is required.'},{status:503});
  return NextResponse.json({...((data ?? {payload:null,version:0,updated_at:null})),actor:ctx.profile.full_name||'CRM user',role:ctx.profile.role},{headers:{'Cache-Control':'private, no-store'}});
}

type RecordLike={id:string;status?:string;name?:string;company?:string;businessName?:string;client?:string;title?:string;fullName?:string;submissionId?:string};
function addAudit(previous:Record<string,unknown>|null,next:Record<string,unknown>,actor:string){
  const priorHistory=Array.isArray(previous?.history)?previous.history:[];
  const entries:Record<string,string>[]=[];
  for(const key of ['prospects','leads','clients','payments','notifications','webForms'] as const){
    const before=new Map(((previous?.[key] as RecordLike[])||[]).map(item=>[item.id,item]));
    for(const item of ((next[key] as RecordLike[])||[])){const old=before.get(item.id);const label=item.businessName||item.company||item.name||item.client||item.title||item.fullName||item.submissionId||item.id;if(!old)entries.push({id:crypto.randomUUID(),actor,action:'Created',entity:key.slice(0,-1),entityId:item.id,details:`Created ${label}`,createdAt:new Date().toISOString()});else if(JSON.stringify(old)!==JSON.stringify(item)){const status=old.status!==item.status?` Status changed from ${old.status||'—'} to ${item.status||'—'}.`:'';entries.push({id:crypto.randomUUID(),actor,action:'Updated',entity:key.slice(0,-1),entityId:item.id,details:`Updated ${label}.${status}`,createdAt:new Date().toISOString()})}before.delete(item.id)}
    for(const item of before.values()){const label=item.businessName||item.company||item.name||item.client||item.title||item.fullName||item.submissionId||item.id;entries.push({id:crypto.randomUUID(),actor,action:'Deleted',entity:key.slice(0,-1),entityId:item.id,details:`Deleted ${label}`,createdAt:new Date().toISOString()})}
  }
  return {...next,history:[...entries,...priorHistory].slice(0,50_000)};
}

export async function PUT(request:Request) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({error:'Unauthorized'},{status:401});
  const body = await request.json().catch(()=>null);
  const parsed = crmWorkspaceSchema.safeParse(body?.payload);
  const version = Number(body?.version);
  if (!parsed.success || !Number.isSafeInteger(version) || version<0) return NextResponse.json({error:'Invalid CRM data.'},{status:400});
  if (version===0) {
    const payload=addAudit(null,parsed.data,ctx.profile.full_name||'CRM user');
    const {data,error}=await ctx.admin.from('crm_workspace_state').insert({id:'primary',payload,updated_by:ctx.profile.id}).select('version,updated_at,payload').single();
    if (error?.code==='23505') return NextResponse.json({error:'CRM data changed on another device. Refresh before saving.'},{status:409});
    if (error) return NextResponse.json({error:'Unable to save CRM data.'},{status:500});
    return NextResponse.json(data);
  }
  const {data:current}=await ctx.admin.from('crm_workspace_state').select('payload,version').eq('id','primary').maybeSingle();
  if(!current||current.version!==version)return NextResponse.json({error:'CRM data changed on another device. Refresh before saving.'},{status:409});
  const payload=addAudit(current.payload as Record<string,unknown>,parsed.data,ctx.profile.full_name||'CRM user');
  const {data,error}=await ctx.admin.from('crm_workspace_state').update({payload,version:version+1,updated_by:ctx.profile.id,updated_at:new Date().toISOString()}).eq('id','primary').eq('version',version).select('version,updated_at,payload').maybeSingle();
  if (error) return NextResponse.json({error:'Unable to save CRM data.'},{status:500});
  if (!data) return NextResponse.json({error:'CRM data changed on another device. Refresh before saving.'},{status:409});
  return NextResponse.json(data);
}
