import Link from 'next/link';
import { publishedStore, type StoreDocsChannel } from '@/lib/store-publication';
import styles from './store-landing.module.css';

export function StoreVersion({ lang, channel, releasedHref, nextHref }: {
  readonly lang: 'en' | 'ko';
  readonly channel: StoreDocsChannel;
  readonly releasedHref?: string;
  readonly nextHref?: string;
}) {
  return (
    <aside className={styles.storeVersion} data-docs-channel={channel} data-docs-version={channel === 'released' ? publishedStore.version : 'next'}>
      <nav aria-label={lang === 'ko' ? 'Store 문서 버전' : 'Store documentation version'}>
        <Link href={releasedHref ?? `/${lang}/store`} data-doc-channel-link="released" aria-current={channel === 'released' ? 'page' : undefined}>
          v{publishedStore.version} · {lang === 'ko' ? '공개 문서' : 'Released'}
        </Link>
        <Link href={nextHref ?? `/${lang}/store/next`} data-doc-channel-link="next" aria-current={channel === 'next' ? 'page' : undefined}>
          next · {lang === 'ko' ? '개발 문서' : 'Development'}
        </Link>
      </nav>
      {channel === 'next'
        ? <p role="note">{lang === 'ko' ? 'main 기준 · 미배포 변경사항을 포함합니다.' : 'Tracks main · includes unpublished changes.'}</p>
        : <p>{lang === 'ko' ? 'npm 1.1.2에 포함된 README와 실행 코드를 기준으로 합니다.' : 'README and runtime from npm 1.1.2.'}</p>}
    </aside>
  );
}
