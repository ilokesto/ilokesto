'use client';

import { Store } from '@ilokesto/store';
import { useState } from 'react';
import { storePilotEnabled } from '@/lib/store-publication';
import { StoreLandingView } from './store-landing-view';

export function StoreLanding({ lang }: { readonly lang: 'en' | 'ko' }) {
  const [store] = useState(() => new Store({ count: 0 }));
  return <StoreLandingView lang={lang} store={store} channel={storePilotEnabled ? 'next' : undefined} />;
}
