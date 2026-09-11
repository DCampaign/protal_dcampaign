import { z } from 'zod';

export const catalogSchema = z.array(z.object({
  service: z.union([z.string().min(1), z.number().int().nonnegative()]).transform(String),
  name: z.string().min(1).max(1000), category: z.string().max(500),
  rate: z.coerce.number().finite().nonnegative(), min: z.coerce.number().int().positive(),
  max: z.coerce.number().int().positive(), type: z.string().max(80),
}).refine(s => s.max >= s.min)).min(1).max(1000);

export function validatePublicEndpoint(endpoint: string, allowedHosts: string) {
  const url = new URL(endpoint);
  const allowed = allowedHosts.split(',').map(host => host.trim().toLowerCase()).filter(Boolean);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443') || !allowed.includes(url.hostname)) throw new Error('Use an HTTPS endpoint on a host configured in SMM_ALLOWED_API_HOSTS.');
  return url.toString();
}
