import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { validatePublicEndpoint } from './validation';

function encryptionKey() {
  const key = Buffer.from(process.env.SMM_ENCRYPTION_KEY ?? '', 'base64');
  if (key.length !== 32) throw new Error('Configure SMM_ENCRYPTION_KEY with a base64-encoded 32-byte key.');
  return key;
}
export function validateEndpoint(endpoint: string) {
  return validatePublicEndpoint(endpoint, process.env.SMM_ALLOWED_API_HOSTS ?? '');
}
export function encryptKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64')).join('.');
}
function decryptKey(value: string) {
  const [iv, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64'));
  if (!iv || !tag || !data) throw new Error('Invalid stored provider credentials.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
export async function providerRequest(provider: { endpoint: string; encrypted_key: string }, params: Record<string, string>): Promise<unknown> {
  try {
    const response = await fetch(validateEndpoint(provider.endpoint), {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...params, key: decryptKey(provider.encrypted_key) }),
    });
    if (!response.ok || !response.body) throw new Error('Invalid response');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 5_000_000) { await reader.cancel(); throw new Error('Response too large'); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch { throw new Error('Provider request failed. Check the API endpoint, credentials, and provider account.'); }
}
