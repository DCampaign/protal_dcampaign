import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { crmWorkspaceSchema } from '@/lib/crm/workspace-schema';

export const dynamic = 'force-dynamic';

const text = z.string().trim().max(2000).optional().default('');
const submissionSchema = z.object({
  submissionId: text,
  submittedAtUtc: text,
  submittedAtIst: text,
  submissionType: text,
  formName: text,
  sourcePage: text,
  fullName: text,
  email: text,
  phone: text,
  company: text,
  website: text,
  message: text,
  growthTarget: text,
  preferredDate: text,
  preferredTime: text,
  positionApplied: text,
  department: text,
  experience: text,
  currentCompany: text,
  location: text,
  resumeLink: text,
  portfolioLink: text,
  resumeFilename: text,
  resumeMimeType: text,
  resumeSizeBytes: text,
  ipAddress: text,
  userAgent: text,
  referrer: text,
  deliveryNotes: text,
  quality: z.enum(['Good','Bad','Neutral']).optional().default('Neutral'),
});

type Submission = z.infer<typeof submissionSchema>;

function identity(record: Submission) {
  if (record.submissionId) return `id:${record.submissionId.toLowerCase()}`;
  return `form:${[record.submittedAtUtc,record.submittedAtIst,record.formName,record.fullName,record.email,record.phone,record.sourcePage].map(value=>value.toLowerCase()).join('|')}`;
}

export async function POST(request: Request) {
  const secret = process.env.WEB_FORM_INGEST_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i,'') || request.headers.get('x-web-form-secret');
  if (!secret) return NextResponse.json({error:'Web form intake is not configured.'},{status:503});
  if (!provided || provided.length !== secret.length || !timingSafeEqual(Buffer.from(provided),Buffer.from(secret))) {
    return NextResponse.json({error:'Unauthorized'},{status:401});
  }

  const parsed = submissionSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:'Invalid web form submission.'},{status:400});

  const admin = createSupabaseAdminClient();
  const {data: state,error: loadError} = await admin.from('crm_workspace_state').select('payload,version').eq('id','primary').maybeSingle();
  if (loadError) return NextResponse.json({error:'CRM database migration is required.'},{status:503});

  const current = crmWorkspaceSchema.safeParse(state?.payload || {leads:[],prospects:[],clients:[],payments:[],history:[],notifications:[],webForms:[]});
  if (!current.success) return NextResponse.json({error:'CRM workspace needs administrator repair before intake can continue.'},{status:409});

  const stamp = new Date().toISOString();
  const incoming = {...parsed.data,id:crypto.randomUUID(),createdAt:stamp,updatedAt:stamp};
  const key = identity(incoming);
  const existing = current.data.webForms.find(record=>identity(record)===key);
  const webForms = existing
    ? current.data.webForms.map(record=>identity(record)===key?{...record,...Object.fromEntries(Object.entries(incoming).filter(([field,value])=>field==='id'||field==='createdAt'||field==='updatedAt'||field==='quality'||value!=='')),id:record.id,createdAt:record.createdAt,updatedAt:stamp}:record)
    : [incoming,...current.data.webForms];
  const tasks = Array.isArray((state?.payload as {tasks?: unknown[]}|undefined)?.tasks) ? (state?.payload as {tasks: unknown[]}).tasks : [];
  const payload = {...current.data,tasks,webForms};

  if (!state) {
    const {data,error} = await admin.from('crm_workspace_state').insert({id:'primary',payload}).select('version,payload').single();
    if (error) return NextResponse.json({error:'Unable to create CRM workspace.'},{status:409});
    return NextResponse.json({ok:true,created:true,version:data.version,submissionId:incoming.submissionId});
  }

  const {data,error} = await admin.from('crm_workspace_state').update({payload,version:state.version+1,updated_at:stamp}).eq('id','primary').eq('version',state.version).select('version,payload').maybeSingle();
  if (error || !data) return NextResponse.json({error:'CRM workspace changed. Retry the submission.'},{status:409});
  return NextResponse.json({ok:true,created:!existing,version:data.version,submissionId:incoming.submissionId});
}
