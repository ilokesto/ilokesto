import { getLLMText, developmentSource } from '@/lib/source';
import { storePilotEnabled } from '@/lib/store-publication';

export async function GET() {
  if (!storePilotEnabled) return new Response(null, { status: 404 });
  const pages = await Promise.all(developmentSource.getPages().map(getLLMText));
  return new Response(pages.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex' },
  });
}
