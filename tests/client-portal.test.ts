import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detailsSchema, recordInput } from '../lib/client-portal/schema';
import { isCrmRole } from '../lib/auth/permissions';

const fixture=vi.hoisted(()=>({user:'user-a' as string|null,tables:{} as Record<string,Record<string,unknown>[]>,rpc:vi.fn()}));
vi.mock('../lib/supabase/server',()=>({createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:fixture.user?{id:fixture.user}:null}})}})}));
vi.mock('../lib/supabase/admin',()=>({createSupabaseAdminClient:()=>({rpc:fixture.rpc,from:(name:string)=>{
 let rows=fixture.tables[name]||[];
 const query={select:()=>query,eq:(key:string,value:unknown)=>{rows=rows.filter(r=>r[key]===value);return query;},in:(key:string,values:unknown[])=>{rows=rows.filter(r=>values.includes(r[key]));return query;},order:()=>query,range:(from:number,to:number)=>{rows=rows.slice(from,to+1);return query;},maybeSingle:async()=>({data:rows[0]||null,error:null}),then:(resolve:(value:{data:Record<string,unknown>[];error:null})=>unknown)=>Promise.resolve(resolve({data:rows,error:null}))};return query;
}})}));
import { GET, POST } from '../app/api/client-portal/route';
import { portalActor, portalContext } from '../lib/client-portal/server';
const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',ra='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',rb='bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb';
const details=()=>detailsSchema.parse({title:'Homepage design',status:'Ready for Review',approvalRequired:true});
beforeEach(()=>{
 fixture.user='user-a';fixture.rpc.mockReset();fixture.rpc.mockResolvedValue({data:ra,error:null});
 fixture.tables={
  profiles:[{id:'profile-a',user_id:'user-a',role:'client',is_active:true,full_name:'Client A',email:'a@example.test'},{id:'profile-b',user_id:'user-b',role:'client',is_active:true,full_name:'Client B',email:'b@example.test'},{id:'employee',user_id:'user-employee',role:'admin',is_active:true,full_name:'Employee',email:'employee@example.test'}],
  portal_accounts:[{id:a,crm_client_id:'crm-a',is_active:true,manager_id:'employee'},{id:b,crm_client_id:'crm-b',is_active:true,manager_id:null}],
  portal_members:[{id:'member-a',account_id:a,profile_id:'profile-a',is_active:true,last_read_at:null},{id:'member-b',account_id:b,profile_id:'profile-b',is_active:true,last_read_at:null}],
  portal_records:[{id:ra,account_id:a,kind:'deliverable',visible:true,details:details(),version:1},{id:rb,account_id:b,kind:'deliverable',visible:true,details:details(),version:1},{id:'hidden-a',account_id:a,kind:'work',visible:false,details:{...details(),title:'Internal costing'},version:1}],
  portal_events:[{id:'ea',record_id:ra,account_id:a,visible:true,message:'Please review',kind:'Created'},{id:'internal',record_id:ra,account_id:a,visible:false,message:'Internal notes'},{id:'eb',record_id:rb,account_id:b,visible:true,message:'Company B private'},{id:'hidden-parent',record_id:'hidden-a',account_id:a,visible:true,message:'Hidden project update'}],
  crm_workspace_state:[{id:'primary',payload:{leads:[],prospects:[],clients:['a','b'].map(letter=>({id:'crm-'+letter,name:'Contact '+letter,company:'Company '+letter,phone:'123',services:'SEO',start:'2026-09-01',value:5000,payment:'Pending',status:'Active',notes:'Private sales notes'})),payments:[{id:'pa',sourceClientId:'crm-a',client:'Company a',service:'SEO',amount:5000,paidAmount:1000,due:'2026-10-01',paid:'',status:'Partially Paid',method:'UPI',notes:'Private margin'},{id:'pb',sourceClientId:'crm-b',client:'Company b',service:'SEO',amount:10000,due:'',paid:'',status:'Pending',method:'UPI'},{id:'unlinked',client:'Company a',service:'SEO',amount:10000,due:'',paid:'',status:'Pending',method:'UPI'}]}}],
 };
});
const get=(account?:string)=>GET(new Request('http://localhost/api/client-portal'+(account?'?account='+account:'')));
const post=(action:string,input:unknown,accountId=a)=>POST(new Request('http://localhost/api/client-portal',{method:'POST',headers:{origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify({action,accountId,input})}));
describe('portal server authorization using employee, Client A and Client B fixtures',()=>{
 it('rejects anonymous reads and writes',async()=>{fixture.user=null;expect((await get()).status).toBe(401);expect((await post('comment',{})).status).toBe(401);expect(fixture.rpc).not.toHaveBeenCalled();});
 it('does not classify client identities as CRM employees',async()=>{expect(isCrmRole((await portalActor()).profile.role)).toBe(false);fixture.user='user-employee';expect(isCrmRole((await portalActor()).profile.role)).toBe(true);});
 it('Client A sees only their visible records, history and explicitly linked payments',async()=>{const response=await get();expect(response.status).toBe(200);const data=await response.json();expect(data.records.map((r:{id:string})=>r.id)).toEqual([ra]);expect(data.events.map((e:{id:string})=>e.id)).toEqual(['ea']);expect(data.payments.map((p:{id:string})=>p.id)).toEqual(['pa']);expect(JSON.stringify(data)).not.toMatch(/Private sales|Private margin|Internal notes|Internal costing|Company B private/);expect(data.clients).toEqual([]);});
 it('Client B cannot fetch A through account query parameters',async()=>{fixture.user='user-b';expect((await get(a)).status).toBe(403);const data=await (await get()).json();expect(data.account.id).toBe(b);expect(data.records[0].id).toBe(rb);});
 it('Client A cannot fetch B through account query parameters',async()=>{expect((await get(b)).status).toBe(403);});
 it('rejects a guessed record from another client or an internal-only record',async()=>{expect((await post('comment',{id:rb,version:1,message:'attack'})).status).toBe(404);expect(fixture.rpc).not.toHaveBeenCalled();});
 it('rejects changing account IDs in the request body',async()=>{expect((await post('approve',{id:rb,version:1},b)).status).toBe(403);});
 it('rejects disabled profile, membership and company access independently',async()=>{fixture.tables.profiles[0].is_active=false;expect((await get()).status).toBe(403);fixture.tables.profiles[0].is_active=true;fixture.tables.portal_members[0].is_active=false;expect((await get()).status).toBe(403);fixture.tables.portal_members[0].is_active=true;fixture.tables.portal_accounts[0].is_active=false;expect((await get()).status).toBe(403);expect((await post('approve',{id:ra,version:1})).status).toBe(403);});
 it('rejects deleted/archived CRM clients',async()=>{const payload=fixture.tables.crm_workspace_state[0].payload as {clients:{archivedAt?:string}[]};payload.clients[0].archivedAt='2026-09-17';expect((await get()).status).toBe(403);});
 it('employees can read authorized internal work',async()=>{fixture.user='user-employee';const data=await (await get(a)).json();expect(data.employee).toBe(true);expect(data.records.some((r:{id:string})=>r.id==='hidden-a')).toBe(true);});
 it('limits non-admin employees to assigned accounts',async()=>{fixture.user='user-employee';fixture.tables.profiles[2].role='account_manager';expect((await portalContext(a)).account?.id).toBe(a);expect((await get(b)).status).toBe(403);});
 it('clients cannot create work, edit pricing, invite users or disable companies',async()=>{expect((await post('save',{accountId:a,kind:'work',details:{...details(),status:'In Progress'}})).status).toBe(403);expect((await post('access',{clientId:'crm-a',managerId:null,active:false})).status).toBe(403);expect((await post('invite',{accountId:a,name:'Attacker',email:'x@example.test'})).status).toBe(403);expect((await post('profile',{name:'Client A',email:'a@example.test',phone:'123',website:'',address:'',price:0})).status).toBe(400);expect(fixture.rpc).not.toHaveBeenCalled();});
 it('requires feedback for changes and rejects double approvals',async()=>{expect((await post('changes',{id:ra,version:1,message:''})).status).toBe(400);(fixture.tables.portal_records[0].details as {status:string}).status='Approved';expect((await post('approve',{id:ra,version:1})).status).toBe(409);});
 it('passes verified approval identity and version to the atomic history operation',async()=>{expect((await post('approve',{id:ra,version:1})).status).toBe(200);expect(fixture.rpc).toHaveBeenCalledWith('portal_write',expect.objectContaining({p_actor:'profile-a',p_account:a,p_action:'approve',p_input:expect.objectContaining({id:ra,version:1})}));});
 it('requires same-origin mutations',async()=>{const response=await POST(new Request('http://localhost/api/client-portal',{method:'POST',headers:{origin:'https://untrusted.example'},body:JSON.stringify({action:'approve',accountId:a,input:{id:ra,version:1}})}));expect(response.status).toBe(403);expect(fixture.rpc).not.toHaveBeenCalled();});
 it('reports optimistic locking failure instead of claiming success',async()=>{fixture.rpc.mockResolvedValue({data:null,error:{message:'Record changed'}});expect((await post('approve',{id:ra,version:1})).status).toBe(409);});
});
describe('portal validation',()=>{
 it('rejects script URLs and out-of-range progress',()=>{expect(detailsSchema.safeParse({...details(),url:'javascript:alert(1)'}).success).toBe(false);expect(detailsSchema.safeParse({...details(),progress:101}).success).toBe(false);});
 it('requires meeting times, file links, correct statuses and edit versions',()=>{expect(recordInput.safeParse({accountId:a,kind:'meeting',details:{...details(),status:'Scheduled'}}).success).toBe(false);expect(recordInput.safeParse({accountId:a,kind:'file',details:{...details(),status:'Shared'}}).success).toBe(false);expect(recordInput.safeParse({accountId:a,kind:'work',details:details()}).success).toBe(false);expect(recordInput.safeParse({accountId:a,kind:'deliverable',id:ra,details:details()}).success).toBe(false);});
});
