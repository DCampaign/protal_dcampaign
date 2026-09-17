import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRole } from '@/lib/auth/permissions';
import { portalActor, portalContext, portalData, PortalError, crmClients } from '@/lib/client-portal/server';
import { canReadPortalRecord, canRespond, link, recordInput, type PortalRecord } from '@/lib/client-portal/schema';

export const dynamic='force-dynamic';
function failure(error:unknown) { return NextResponse.json({error:error instanceof PortalError?error.message:'Unable to complete the operation. Please retry.'},{status:error instanceof PortalError?error.status:500}); }
function checkOrigin(request:Request) {
  const origin=request.headers.get('origin');
  const allowed=[new URL(request.url).origin];
  if(process.env.NEXT_PUBLIC_APP_URL)allowed.push(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
  if(!origin||!allowed.includes(origin))throw new PortalError('Invalid request origin.',403);
}
export async function GET(request:Request) {try{return NextResponse.json(await portalData(new URL(request.url).searchParams.get('account')),{headers:{'Cache-Control':'private, no-store'}});}catch(error){return failure(error);}}
const eventInput=z.object({id:z.string().uuid(),version:z.number().int().positive(),message:z.string().trim().max(5000).default(''),attachment:link.default(''),visible:z.boolean().default(true)}).strict();
const contactInput=z.object({name:z.string().trim().min(2).max(120),email:z.string().email().max(200),phone:z.string().trim().max(200),website:link,address:z.string().trim().max(2000)}).strict();
const accessInput=z.object({clientId:z.string().min(1).max(100),managerId:z.string().uuid().nullable(),active:z.boolean()}).strict();
const inviteInput=z.object({accountId:z.string().uuid(),name:z.string().trim().min(2).max(120),email:z.string().trim().email().max(200)}).strict();

export async function POST(request:Request) {
 try {
  checkOrigin(request);
  if(Number(request.headers.get('content-length')||0)>40000)throw new PortalError('Request is too large.',413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>40000)throw new PortalError('Request is too large.',413);
  const parsedBody=(()=>{try{return JSON.parse(raw) as unknown;}catch{return null;}})();
  if(!parsedBody||typeof parsedBody!=='object'||Array.isArray(parsedBody)||typeof (parsedBody as Record<string,unknown>).action!=='string')throw new PortalError('Invalid request.');
  const body=parsedBody as Record<string,unknown> & {action:string};
  if(body.action==='access'){
    const ctx=await portalActor();if(!isAdminRole(ctx.profile.role))throw new PortalError('Only administrators can manage portal access.',403);
    const input=accessInput.safeParse(body.input);if(!input.success)throw new PortalError('Select a client and account manager.');
    const workspace=await crmClients(ctx);
    if(!workspace.clients.some(c=>c.id===input.data.clientId&&!c.archivedAt))throw new PortalError('Client not found.',404);
    if(input.data.managerId){const {data}=await ctx.admin.from('profiles').select('role,is_active').eq('id',input.data.managerId).maybeSingle();if(!data?.is_active||!['super_admin','admin','account_manager','team_member'].includes(data.role))throw new PortalError('Invalid account manager.');}
    const {data,error}=await ctx.admin.from('portal_accounts').upsert({crm_client_id:input.data.clientId,manager_id:input.data.managerId,is_active:input.data.active},{onConflict:'crm_client_id'}).select('id').single();
    if(error)throw new PortalError('Could not save access. Check the client portal database migration.',503);
    return NextResponse.json({ok:true,accountId:data.id});
  }
  if(body.action==='invite'){
    const parsed=inviteInput.safeParse(body.input);if(!parsed.success)throw new PortalError('Enter a valid name and email.');
    const ctx=await portalContext(parsed.data.accountId);if(!isAdminRole(ctx.profile.role)||!ctx.account?.is_active)throw new PortalError('Only administrators can invite users to an active portal.',403);
    const email=parsed.data.email.toLowerCase();
    const {data:existing,error:lookupError}=await ctx.admin.from('profiles').select('id,role,is_active').eq('email',email).maybeSingle();
    if(lookupError)throw new PortalError('Unable to verify the account.',503);
    if(existing&&(existing.role!=='client'||!existing.is_active))throw new PortalError('This email belongs to an employee or disabled account.');
    if(existing){const {data:m}=await ctx.admin.from('portal_members').select('account_id').eq('profile_id',existing.id).maybeSingle();if(m)throw new PortalError('This user already has portal membership. Manage their access below.');}
    const origin=process.env.NEXT_PUBLIC_APP_URL;
    if(!origin||!/^https?:\/\//.test(origin))throw new PortalError('Configure the application URL before sending invitations.',503);
    let profileId=existing?.id;
    if(!profileId){
      const {data,error}=await ctx.admin.auth.admin.inviteUserByEmail(email,{data:{full_name:parsed.data.name},redirectTo:`${new URL(origin).origin}/client-portal/activate`});
      if(error||!data.user)throw new PortalError('Invitation could not be sent. Check the email configuration or existing account.',400);
      const {data:p,error:profileError}=await ctx.admin.from('profiles').select('id').eq('user_id',data.user.id).eq('role','client').single();
      if(profileError||!p)throw new PortalError('Invitation sent but membership needs administrator attention.',503);
      profileId=p.id;
    }
    const {error}=await ctx.admin.from('portal_members').insert({account_id:ctx.account.id,profile_id:profileId,is_active:true});
    if(error)throw new PortalError('Could not link this user. They may already belong to another portal.',409);
    return NextResponse.json({ok:true,message:existing?'Existing client account linked. They can sign in using their existing password.':'Invitation sent. The client can set their own password from the email.'});
  }
  const ctx=await portalContext(typeof body.accountId==='string'?body.accountId:null);
  if(!ctx.account)throw new PortalError('Select a client workspace.');
  if(body.action==='member'){
    if(!isAdminRole(ctx.profile.role))throw new PortalError('Only administrators can manage members.',403);
    const parsed=z.object({id:z.string().uuid(),active:z.boolean()}).strict().safeParse(body.input);if(!parsed.success)throw new PortalError('Invalid membership.');
    const {data,error}=await ctx.admin.from('portal_members').update({is_active:parsed.data.active}).eq('id',parsed.data.id).eq('account_id',ctx.account.id).select('id').maybeSingle();
    if(error||!data)throw new PortalError('Member not found.',404);return NextResponse.json({ok:true});
  }
  if(body.action==='read'){
    if(!ctx.employee){const {error}=await ctx.admin.from('portal_members').update({last_read_at:new Date().toISOString()}).eq('profile_id',ctx.profile.id).eq('account_id',ctx.account.id);if(error)throw new PortalError('Unable to mark updates read.',503);}
    return NextResponse.json({ok:true});
  }
  if(body.action==='profile'){
    if(ctx.employee)throw new PortalError('Edit client contact details in CRM.',403);
    const parsed=contactInput.safeParse(body.input);if(!parsed.success)throw new PortalError(parsed.error.issues[0].message);
    const {error}=await ctx.admin.rpc('portal_update_contact',{p_actor:ctx.profile.id,p_account:ctx.account.id,p_contact:parsed.data});
    if(error)throw new PortalError('Contact details could not be saved.',409);return NextResponse.json({ok:true});
  }
  if(ctx.employee && !isAdminRole(ctx.profile.role)&&!['account_manager','team_member'].includes(ctx.profile.role))throw new PortalError('Your role cannot update client work.',403);
  let input:Record<string,unknown>;
  if(body.action==='save'){
    const parsed=recordInput.safeParse(body.input);if(!parsed.success)throw new PortalError(parsed.error.issues[0].message);
    if(parsed.data.accountId!==ctx.account.id)throw new PortalError('Access denied.',403);
    if(!ctx.employee&&(parsed.data.id||parsed.data.kind!=='request'||!parsed.data.visible||parsed.data.details.status!=='Submitted'))throw new PortalError('Clients can only create requests.',403);
    input=parsed.data;
  }else if(['comment','approve','changes'].includes(body.action)){
    const parsed=eventInput.safeParse(body.input);if(!parsed.success)throw new PortalError('Invalid response.');
    if(['comment','changes'].includes(body.action)&&parsed.data.message.length<2)throw new PortalError('Please enter your feedback.');
    input=parsed.data;if(!ctx.employee)input.visible=true;
  }else throw new PortalError('Unknown operation.');
  if(input.id){
    const {data,error}=await ctx.admin.from('portal_records').select('*').eq('id',input.id).eq('account_id',ctx.account.id).maybeSingle();
    if(error||!data||!canReadPortalRecord(ctx.employee,ctx.account.id,data as PortalRecord))throw new PortalError('Record not found.',404);
    if(['approve','changes'].includes(body.action)&&(ctx.employee||!canRespond(data as PortalRecord)))throw new PortalError('This deliverable is not awaiting your approval.',409);
  }
  const {data,error}=await ctx.admin.rpc('portal_write',{p_actor:ctx.profile.id,p_account:ctx.account.id,p_action:body.action,p_input:input});
  if(error)throw new PortalError('Unable to save. The record or access may have changed; refresh and retry.',409);
  return NextResponse.json({ok:true,id:data});
 }catch(error){return failure(error);}
}
