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
  const { data: profile } = await admin.from('profiles').select('id,role,is_active').eq('user_id',user.id).maybeSingle();
  return profile?.is_active && isCrmRole(profile.role) ? { admin, profile } : null;
}

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data,error} = await ctx.admin.from('crm_workspace_state').select('payload,version,updated_at').eq('id','primary').maybeSingle();
  if (error) return NextResponse.json({error:'CRM database migration is required.'},{status:503});
  return NextResponse.json(data ?? {payload:null,version:0,updated_at:null},{headers:{'Cache-Control':'private, no-store'}});
}

export async function PUT(request:Request) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({error:'Unauthorized'},{status:401});
  if (!['super_admin','admin'].includes(ctx.profile.role)) return NextResponse.json({error:'Only CRM administrators can update records.'},{status:403});
  const body = await request.json().catch(()=>null);
  const parsed = crmWorkspaceSchema.safeParse(body?.payload);
  const version = Number(body?.version);
  if (!parsed.success || !Number.isSafeInteger(version) || version<0) return NextResponse.json({error:'Invalid CRM data.'},{status:400});
  if (version===0) {
    const {data,error}=await ctx.admin.from('crm_workspace_state').insert({id:'primary',payload:parsed.data,updated_by:ctx.profile.id}).select('version,updated_at').single();
    if (error?.code==='23505') return NextResponse.json({error:'CRM data changed on another device. Refresh before saving.'},{status:409});
    if (error) return NextResponse.json({error:'Unable to save CRM data.'},{status:500});
    return NextResponse.json(data);
  }
  const {data,error}=await ctx.admin.from('crm_workspace_state').update({payload:parsed.data,version:version+1,updated_by:ctx.profile.id,updated_at:new Date().toISOString()}).eq('id','primary').eq('version',version).select('version,updated_at').maybeSingle();
  if (error) return NextResponse.json({error:'Unable to save CRM data.'},{status:500});
  if (!data) return NextResponse.json({error:'CRM data changed on another device. Refresh before saving.'},{status:409});
  return NextResponse.json(data);
}
