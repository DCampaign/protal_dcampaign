import { z } from 'zod';

const text = z.string().max(2000);
const id = z.string().min(1).max(100);
const outreach = z.object({ id, date:text, time:text, method:text, outcome:text, notes:text, salesperson:text });
const prospect = z.object({
  id, businessName:text, industry:text, contactPerson:text, phone:text, whatsapp:text, email:text, website:text,
  city:text, state:text, address:text, mapsUrl:text, instagramUrl:text, facebookUrl:text, linkedinUrl:text,
  source:text, opportunities:z.array(text).max(100), potentialServices:z.array(text).max(100), notes:text,
  priority:z.enum(['Hot','Warm','Cold']), assigned:text,
  status:z.enum(['New','Ready for Outreach','Contacted','Follow-up','Interested','Not Interested','No Response','Converted to Lead']),
  outreach:z.array(outreach).max(500), nextOutreach:text, nextTime:text, nextMethod:text, convertedLeadId:text.optional(),
});
const lead = z.object({
  id, name:text, company:text, phone:text, email:text, service:text, source:text,
  status:z.enum(['New','Contacted','Interested','Meeting','Proposal Sent','Follow-up','Negotiation','Won','Lost']),
  priority:z.enum(['Hot','Warm','Cold']), followUp:text, time:text, assigned:text,
  value:z.number().finite().min(0).max(1_000_000_000), notes:text,
});
const client = z.object({
  id, name:text, company:text, phone:text, services:text, start:text,
  value:z.number().finite().min(0).max(1_000_000_000), payment:z.enum(['Paid','Pending','Overdue']),
  status:z.enum(['Active','Inactive','Completed']),
});
const payment = z.object({
  id, client:text, service:text, amount:z.number().finite().min(0).max(1_000_000_000), due:text, paid:text,
  status:z.enum(['Paid','Pending','Overdue']), method:text,
});

export const crmWorkspaceSchema = z.object({
  leads:z.array(lead).max(10_000), prospects:z.array(prospect).max(10_000),
  clients:z.array(client).max(10_000), payments:z.array(payment).max(25_000),
});
export type CrmWorkspacePayload = z.infer<typeof crmWorkspaceSchema>;
