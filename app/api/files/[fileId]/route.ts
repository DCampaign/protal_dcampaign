import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentClientContext } from '@/lib/queries/client-context';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const { supabase, clientId } = await getCurrentClientContext();
  if (!supabase || !clientId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { data: file } = await supabase.from('files').select('storage_path').eq('id', fileId).eq('client_id', clientId).eq('visible_to_client', true).maybeSingle();
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });
  const { data, error } = await supabase.storage.from('client-files').createSignedUrl(file.storage_path, 60, { download: true });
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Download could not be prepared' }, { status: 500 });
  return NextResponse.redirect(new URL(data.signedUrl, request.url));
}
