'use client';

import { useState } from 'react';
import { createPublishedStoreCounter } from '@/lib/published-store';
import { StoreLandingView } from './store-landing-view';

export function PublishedStoreLanding({ lang }: { readonly lang: 'en' | 'ko' }) {
  const [store] = useState(createPublishedStoreCounter);
  return <StoreLandingView lang={lang} store={store} channel="released" />;
}
