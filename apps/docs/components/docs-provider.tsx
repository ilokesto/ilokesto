'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isDevelopmentDocs, storePilotEnabled } from '@/lib/store-publication';

export function DocsProvider({ lang, children }: {
  readonly lang: string;
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  const next = isDevelopmentDocs(pathname.split('/').filter(Boolean).slice(1));
  return (
    <RootProvider
      search={{ options: { type: 'fetch', api: next ? '/api/search/next' : '/api/search' } }}
      i18n={{
        locale: lang,
        locales: lang === 'ko'
          ? [{ locale: 'en', name: '영어' }, { locale: 'ko', name: '한국어' }]
          : [{ locale: 'en', name: 'English' }, { locale: 'ko', name: 'Korean' }],
        translations: lang === 'ko'
          ? {
              search: '검색', searchNoResult: '결과 없음', toc: '목차',
              tocNoHeadings: '제목 없음', lastUpdate: '마지막 업데이트',
              chooseLanguage: '언어 선택', nextPage: '다음', previousPage: '이전',
            }
          : undefined,
      }}
    >
      {storePilotEnabled ? (
        <aside role="note" data-store-docs-pilot="true" className="break-keep border-b border-fd-border bg-fd-muted px-6 py-2 text-xs text-fd-muted-foreground">
          {lang === 'ko'
            ? 'Store 1.1.2 공개 문서 시범 모드입니다. 다른 패키지는 아직 main 기준이며 운영 전환 전입니다.'
            : 'Store 1.1.2 publication pilot. Other packages still track main; this is not a production cutover.'}
        </aside>
      ) : null}
      {children}
    </RootProvider>
  );
}
