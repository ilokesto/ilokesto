import { developmentSource } from '@/lib/source';
import { storePilotEnabled } from '@/lib/store-publication';
import { flexsearchFromSource } from 'fumadocs-core/search/flexsearch';

const search = flexsearchFromSource(developmentSource, { localeMap: { ko: 'cjk' } });

export async function GET(request: Request) {
  if (!storePilotEnabled) return new Response(null, { status: 404 });
  const response = await search.GET(request);
  response.headers.set('X-Robots-Tag', 'noindex');
  return response;
}
