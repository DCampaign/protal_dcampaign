import { z } from 'zod';

const text = z.string().max(2000);
const id = z.string().min(1).max(100);
const outreach = z.object({ id, date:text, time:text, method:text, outcome:text, notes:text, salesperson:text });
const followUpRecord = z.object({ id, date:text, time:text, status:z.enum(['Upcoming','Overdue','Completed']), completedAt:text.optional(), details:text.optional() });
const prospect = z.object({
  id, businessName:text, industry:text, contactPerson:text, phone:text, whatsapp:text, email:text, website:text,
  city:text, state:text, address:text, mapsUrl:text, instagramUrl:text, facebookUrl:text, linkedinUrl:text,
  source:text, opportunities:z.array(text).max(100), potentialServices:z.array(text).max(100), notes:text,
  priority:z.enum(['Hot','Warm','Cold']), assigned:text,
  status:z.enum(['New','Ready for Outreach','Contacted','Follow-up','Interested','Not Interested','No Response','Converted to Lead']),
  outreach:z.array(outreach).max(500), nextOutreach:text, nextTime:text, nextMethod:text, followUpHistory:z.array(followUpRecord).max(1000).optional(), convertedLeadId:text.optional(),
  createdDate:text.optional(), updatedAt:text.optional(), tags:z.array(text).max(50).optional(), followUpCompleted:z.boolean().optional(), followUpCompletedAt:text.optional(), quotationStatus:z.enum(['Not Sent','Preparing','Sent']).optional(), quotationUrl:text.optional(),
});
const lead = z.object({
  id, name:text, company:text, phone:text, email:text, service:text, source:text,
  status:z.enum(['New','Contacted','Interested','Meeting','Proposal Sent','Follow-up','Negotiation','Won','Lost']),
  priority:z.enum(['Hot','Warm','Cold']), followUp:text, time:text, assigned:text,
  value:z.number().finite().min(0).max(1_000_000_000), notes:text,
  createdDate:text.optional(), updatedAt:text.optional(), archivedAt:text.optional(), conversionDate:text.optional(), sourceProspectId:text.optional(), convertedClientId:text.optional(), tags:z.array(text).max(50).optional(),
  industry:text.optional(), whatsapp:text.optional(), website:text.optional(), city:text.optional(), state:text.optional(), address:text.optional(),
  mapsUrl:text.optional(), instagramUrl:text.optional(), facebookUrl:text.optional(), linkedinUrl:text.optional(),
  opportunities:z.array(text).max(100).optional(), potentialServices:z.array(text).max(100).optional(), outreach:z.array(outreach).max(500).optional(), followUpHistory:z.array(followUpRecord).max(1000).optional(),
  followUpCompleted:z.boolean().optional(), followUpCompletedAt:text.optional(), quotationStatus:z.enum(['Not Sent','Preparing','Sent']).optional(), quotationUrl:text.optional(),
});
const client = z.object({
  id, name:text, company:text, phone:text, services:text, start:text,
  value:z.number().finite().min(0).max(1_000_000_000), payment:z.enum(['Paid','Pending','Overdue']),
  status:z.enum(['Active','Inactive','Completed','Ongoing','Discussion','Cancelled']),
  createdDate:text.optional(), updatedAt:text.optional(), archivedAt:text.optional(), sourceLeadId:text.optional(), tags:z.array(text).max(50).optional(), email:text.optional(), whatsapp:text.optional(), website:text.optional(),
  industry:text.optional(), city:text.optional(), state:text.optional(), address:text.optional(), mapsUrl:text.optional(), instagramUrl:text.optional(), facebookUrl:text.optional(), linkedinUrl:text.optional(), notes:text.optional(), source:text.optional(), opportunities:z.array(text).max(100).optional(), quotationStatus:z.enum(['Not Sent','Preparing','Sent']).optional(), quotationUrl:text.optional(),
});
const payment = z.object({
  id, client:text, service:text, amount:z.number().finite().min(0).max(1_000_000_000), due:text, paid:text,
  status:z.enum(['Paid','Pending','Overdue','Partially Paid','Cancelled']), method:text, paidAmount:z.number().finite().min(0).max(1_000_000_000).optional(), notes:text.optional(), createdDate:text.optional(), updatedAt:text.optional(), archivedAt:text.optional(), sourceClientId:text.optional(), paymentDates:z.array(text).max(100).optional(), tags:z.array(text).max(50).optional(),
});
const historyEntry = z.object({
  id, actor:text, action:text, entity:text, entityId:text.optional(), details:text, createdAt:text, updatedAt:text.optional(),
});
const notification = z.object({id, title:text, message:text, createdAt:text, createdBy:text, isActive:z.boolean().default(true)});
const webFormSubmission = z.object({
  id, submissionId:text, submittedAtUtc:text, submittedAtIst:text, submissionType:text, formName:text, sourcePage:text,
  fullName:text, email:text, phone:text, company:text, website:text, message:text, growthTarget:text, preferredDate:text, preferredTime:text,
  positionApplied:text, department:text, experience:text, currentCompany:text, location:text, resumeLink:text, portfolioLink:text,
  resumeFilename:text, resumeMimeType:text, resumeSizeBytes:text, ipAddress:text, userAgent:text, referrer:text, deliveryNotes:text,
  quality:z.enum(['Good','Bad','Neutral']).default('Neutral'), createdAt:text, updatedAt:text,
});

export const crmWorkspaceSchema = z.object({
  leads:z.array(lead).max(10_000), prospects:z.array(prospect).max(10_000),
  clients:z.array(client).max(10_000), payments:z.array(payment).max(25_000), history:z.array(historyEntry).max(50_000).default([]), notifications:z.array(notification).max(2_000).default([]),
  webForms:z.array(webFormSubmission).max(25_000).default([]),
});
export type CrmWorkspacePayload = z.infer<typeof crmWorkspaceSchema>;
