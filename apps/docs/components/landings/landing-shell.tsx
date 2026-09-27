import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LandingPackage } from './landing-packages';
import styles from './store-landing.module.css';

export function LandingShell({ info, lang, children }: {
  readonly info: LandingPackage;
  readonly lang: 'en' | 'ko';
  readonly children: ReactNode;
}) {
  const korean = lang === 'ko';
  return (
    <div className={styles.landing} data-landing={info.name}>
      <a href={`#${info.name}-demo`} className={styles.skip}>{korean ? '데모로 바로 가기' : 'Skip to demo'}</a>
      <header className={styles.header}>
        <Link href={`/${lang}`} aria-label="ilokesto" className={styles.wordmark}>ilokesto<span>/ {info.name}</span></Link>
        <nav aria-label={`${info.title} ${korean ? '탐색' : 'navigation'}`}>
          <Link href={`/${lang}/${info.name}/quick-start`}>
            {korean ? '문서 보기' : 'Documentation'}<ArrowUpRight size={15} aria-hidden />
          </Link>
          <a href={`https://github.com/ilokesto/ilokesto/tree/main/packages/${info.name}`}>GitHub<ArrowUpRight size={15} aria-hidden /></a>
          <Link href={`/${korean ? 'en' : 'ko'}/${info.name}`} hrefLang={korean ? 'en' : 'ko'} className={styles.language}>
            {korean ? 'EN' : '한국어'}
          </Link>
        </nav>
      </header>
      <main className={styles.stage}>
        <div className={styles.artwork} aria-hidden="true">
          <Image src={`/illustrations/${info.name}-workshop.webp`} alt="" fill priority sizes="100vw" className={styles.image} />
        </div>
        <div className={styles.intro}>
          <h1>{info.title}<span>.</span></h1>
          <p className={styles.tagline}>{info[lang]}</p>
          {info.name === 'fetcher' ? <p className={styles.beta}>Beta</p> : null}
        </div>
        {children}
        <footer className={styles.footer}>
          <Link href={`/${lang}`}><ArrowLeft size={16} aria-hidden />{korean ? '모든 패키지' : 'All packages'}</Link>
          <p>{korean ? '만드는 일은, 조금 더 즐겁게.' : 'A little more joy in making.'}</p>
          <span>@ilokesto/{info.name}</span>
        </footer>
      </main>
    </div>
  );
}
