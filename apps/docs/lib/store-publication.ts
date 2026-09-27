import pilotRelease from '../../../docs-publication/pilot-release.json' with { type: 'json' };

const pilot = process.env.NEXT_PUBLIC_STORE_DOCS_PILOT;
if (pilot !== undefined && pilot !== '0' && pilot !== '1') {
  throw new Error('NEXT_PUBLIC_STORE_DOCS_PILOT must be 0 or 1');
}

export const storePilotEnabled = pilot === '1';
export const publishedStore = pilotRelease.release;
export type StoreDocsChannel = 'released' | 'next';

export function isDevelopmentDocs(slugs: readonly string[] | undefined) {
  return storePilotEnabled && Boolean(slugs?.length)
    && (slugs?.[0] !== 'store' || slugs[1] === 'next');
}

export function getStoreDocsChannel(slugs: readonly string[] | undefined): StoreDocsChannel | undefined {
  if (!storePilotEnabled || slugs?.[0] !== 'store') return undefined;
  return slugs[1] === 'next' ? 'next' : 'released';
}

export function isStoreIndex(slugs: readonly string[] | undefined) {
  return slugs?.[0] === 'store'
    && (slugs.length === 1 || (storePilotEnabled && slugs.length === 2 && slugs[1] === 'next'));
}

export function scopeStoreNextLink(href: string | undefined) {
  if (!href) return href;
  return href.replace(/^\/(en|ko)\/store(?=\/|#|\?|$)(?!\/next(?:\/|#|\?|$))/, '/$1/store/next');
}
