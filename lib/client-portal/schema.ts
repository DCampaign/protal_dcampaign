import { z } from 'zod';

export const kinds = ['work', 'deliverable', 'request', 'file', 'meeting'] as const;
export type Kind = typeof kinds[number];
export const statuses: Record<Kind, readonly string[]> = {
  work: ['Not Started', 'In Progress', 'Waiting for Client', 'Under Review', 'Completed', 'On Hold'],
  deliverable: ['In Progress', 'Ready for Review', 'Approved', 'Changes Requested', 'Completed'],
  request: ['Submitted', 'Under Review', 'In Progress', 'Waiting for Client', 'Completed', 'Rejected / Not Applicable'],
  file: ['Shared'], meeting: ['Scheduled', 'Completed', 'Cancelled'],
};
export const link = z.string().trim().max(2000).refine(v => !v || /^https:\/\//i.test(v) && (() => { try { const u = new URL(v); return !u.username && !u.password; } catch { return false; } })(), 'Use a valid HTTPS link.');
const date = z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)), 'Enter a valid date.');
export const detailsSchema = z.object({
  title: z.string().trim().min(2).max(180), description: z.string().trim().max(10000).default(''),
  service: z.string().trim().max(180).default(''), status: z.string().max(60),
  progress: z.number().int().min(0).max(100).default(0), start: date.default(''), due: date.default(''),
  latestUpdate: z.string().trim().max(5000).default(''), notes: z.string().trim().max(5000).default(''),
  url: link.default(''), approvalRequired: z.boolean().default(false),
  category: z.string().trim().max(100).default('Other'), priority: z.enum(['Normal', 'High']).default('Normal'),
  time: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/).default(''), timezone: z.literal('Asia/Kolkata').default('Asia/Kolkata'),
}).strict();
export type Details = z.infer<typeof detailsSchema>;
export const recordInput = z.object({ id: z.string().uuid().optional(), version: z.number().int().positive().optional(), accountId: z.string().uuid(), kind: z.enum(kinds), parentId: z.string().uuid().nullable().default(null), visible: z.boolean().default(true), details: detailsSchema }).strict().superRefine((v, ctx) => {
  if (!statuses[v.kind].includes(v.details.status)) ctx.addIssue({code:'custom',message:'Invalid status for this record.'});
  if (v.id && !v.version) ctx.addIssue({code:'custom',message:'Refresh this record before saving.'});
  if (v.kind === 'meeting' && (!v.details.due || !v.details.time)) ctx.addIssue({code:'custom',message:'Meeting date and time are required.'});
  if (v.kind === 'file' && !v.details.url) ctx.addIssue({code:'custom',message:'A secure file link is required.'});
  if (v.details.start && v.details.due && v.details.due < v.details.start) ctx.addIssue({code:'custom',message:'Completion date must follow start date.'});
});
export type PortalRecord = { id:string; account_id:string; kind:Kind; parent_id:string|null; visible:boolean; details:Details; version:number; created_at:string; updated_at:string };
export type PortalEvent = { id:string; account_id:string; record_id:string; kind:string; message:string; attachment:string; visible:boolean; actor_name:string; actor_type:string; created_at:string; snapshot:Details|null };
export type Account = { id:string; crm_client_id:string; is_active:boolean; manager_id:string|null; company:string };
export type PortalData = { employee:boolean; canManage:boolean; canInvite:boolean; name:string; account:Account|null; accounts:Account[]; records:PortalRecord[]; events:PortalEvent[]; members:{id:string;profile_id:string;is_active:boolean;name:string;email:string}[]; managers:{id:string;name:string}[]; clients:{id:string;company:string}[]; profile:{name:string;email:string;phone:string;website:string;address:string}; services:{name:string;status:string;start:string}[]; payments:{id:string;service:string;amount:number;paidAmount:number;due:string;paid:string;status:string;method:string}[]; manager:{name:string;email:string}|null; lastRead:string|null };
export function canReadPortalRecord(employee:boolean, accountId:string, record:Pick<PortalRecord,'account_id'|'visible'>) { return record.account_id === accountId && (employee || record.visible); }
export function canRespond(record:PortalRecord) { return record.kind === 'deliverable' && record.visible && record.details.approvalRequired && record.details.status === 'Ready for Review'; }
