import { packageMetadata } from '@/lib/layout.shared';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { homeCopy, packageCards, packageGroups, type Locale, type PackageCard } from './home-content';

function getLocale(lang: string): Locale {
  return lang === 'ko' ? 'ko' : 'en';
}

function PackageCard({ lang, locale, card }: { lang: string; locale: Locale; card: PackageCard }) {
  const { pkg } = card;
  const copy = homeCopy[locale];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-fd-border bg-fd-background/80 p-5 transition-colors hover:bg-fd-accent/50">
      <span
        className={`mb-5 h-1.5 w-10 rounded-full ${packageMetadata[pkg].colorClass}`}
        aria-hidden="true"
      />
      <h4 className="text-base font-semibold tracking-tight">
        <Link
          href={`/${lang}/${pkg}`}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          @ilokesto/{pkg}
        </Link>
      </h4>
      <p className="mt-2 flex-1 text-sm leading-6 text-fd-muted-foreground break-keep">
        {card.descriptions[locale]}
      </p>
      <p className="mt-4 text-xs leading-5 text-fd-muted-foreground">
        <span className="font-semibold text-fd-foreground">{copy.support}:</span>{' '}
        {card.support[locale]}
        {card.beta ? (
          <span className="ml-2 inline-flex rounded-full border border-fd-border px-2 py-0.5 font-semibold text-fd-primary">
            {copy.beta}
          </span>
        ) : null}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-fd-border pt-4 text-xs font-medium">
        <Link
          href={`/${lang}/${pkg}`}
          className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          {copy.packageIntroduction}
        </Link>
        <Link
          href={`/${lang}/${pkg}/quick-start`}
          className="rounded-sm text-fd-muted-foreground underline-offset-4 hover:text-fd-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          {copy.packageQuickStart}
        </Link>
      </div>
    </article>
  );
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = getLocale(lang);
  const copy = homeCopy[locale];

  return (
    <main className="flex-1 overflow-hidden bg-fd-background text-fd-foreground">
      <section className="relative border-b border-fd-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_left,var(--color-fd-primary),transparent_32%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-center lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-fd-border bg-fd-card p-2 shadow-sm sm:size-16">
                <Image
                  src="/ilokesto-logo.webp"
                  alt="ilokesto logo"
                  width={40}
                  height={44}
                  priority
                />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">ilokesto</p>
                <p className="text-xs text-fd-muted-foreground">[iloˈkɛsto]</p>
              </div>
            </div>
            <p className="mb-4 text-sm font-semibold text-fd-primary">{copy.eyebrow}</p>
            <h1 className="max-w-4xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl break-keep">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-fd-muted-foreground sm:text-lg sm:leading-8 break-keep">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#packages"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background"
              >
                {copy.browse}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <aside
            className="rounded-3xl border border-fd-border bg-fd-card p-5 shadow-xl shadow-black/5 sm:p-6"
            aria-labelledby="ecosystem-title"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fd-primary">
                {copy.relationshipEyebrow}
              </p>
              <h2 id="ecosystem-title" className="mt-2 text-xl font-semibold tracking-tight break-keep">
                {copy.relationshipTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-fd-muted-foreground break-keep">
                {copy.relationshipBody}
              </p>
            </div>
            <ol className="mt-6 space-y-3 text-sm">
              <li className="rounded-2xl border border-fd-border bg-fd-background/80 p-4">
                <p className="text-xs font-medium text-fd-muted-foreground">{copy.foundation}</p>
                <Link
                  href={`/${lang}/store`}
                  className="mt-1 inline-block rounded-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                >
                  Store
                </Link>
              </li>
              <li className="ml-4 border-l border-fd-border pl-4 sm:ml-6 sm:pl-5">
                <p className="mb-2 text-xs font-medium text-fd-muted-foreground">{copy.builtOnStore}</p>
                <ul className="grid gap-2 sm:grid-cols-3">
                  {(['state', 'form', 'overlay'] as const).map((pkg) => (
                    <li key={pkg} className="rounded-xl border border-fd-border bg-fd-background/80 px-3 py-2.5">
                      <Link
                        href={`/${lang}/${pkg}`}
                        className="rounded-sm font-semibold capitalize underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                      >
                        {pkg}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 ml-4 border-l border-fd-border pl-4">
                  <p className="mb-2 text-xs font-medium text-fd-muted-foreground">{copy.builtOnOverlay}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {(['modal', 'toast'] as const).map((pkg) => (
                      <li key={pkg} className="rounded-xl border border-fd-border bg-fd-background/80 px-3 py-2.5">
                        <Link
                          href={`/${lang}/${pkg}`}
                          className="rounded-sm font-semibold capitalize underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                        >
                          {pkg}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              <li className="border-t border-fd-border pt-3">
                <p className="mb-2 text-xs font-medium text-fd-muted-foreground">{copy.standalone}</p>
                <ul className="grid grid-cols-2 gap-2">
                  <li className="rounded-xl border border-fd-border bg-fd-background/80 px-3 py-2.5">
                    <Link
                      href={`/${lang}/utilinent`}
                      className="rounded-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                    >
                      Utilinent
                    </Link>
                  </li>
                  <li className="rounded-xl border border-fd-border bg-fd-background/80 px-3 py-2.5">
                    <Link
                      href={`/${lang}/fetcher`}
                      className="rounded-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                    >
                      Fetcher
                    </Link>
                    <span className="ml-2 rounded-full border border-fd-border px-1.5 py-0.5 text-[10px] font-semibold text-fd-primary">
                      {copy.beta}
                    </span>
                  </li>
                </ul>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <section id="packages" className="scroll-mt-20 border-b border-fd-border">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <p className="text-sm font-semibold text-fd-primary">{copy.packagesEyebrow}</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.65fr)] lg:items-end">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl break-keep">
              {copy.packagesTitle}
            </h2>
            <p className="text-sm leading-6 text-fd-muted-foreground lg:text-base break-keep">
              {copy.packagesBody}
            </p>
          </div>

          <div className="mt-12 space-y-10">
            {packageGroups.map((group) => {
              const Icon = group.icon;
              const groupCopy = copy.groups[group.id];

              return (
                <section key={group.id} aria-labelledby={`${group.id}-title`}>
                  <div className="mb-4 flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-fd-border bg-fd-card">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 id={`${group.id}-title`} className="font-semibold tracking-tight">
                        {groupCopy.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-fd-muted-foreground break-keep">
                        {groupCopy.description}
                      </p>
                    </div>
                  </div>
                  <div className={`grid gap-4 sm:grid-cols-2 ${group.packages.length === 3 ? 'xl:grid-cols-3' : ''}`}>
                    {packageCards.filter((card) => group.packages.some((pkg) => pkg === card.pkg)).map((card) => (
                      <PackageCard key={card.pkg} lang={lang} locale={locale} card={card} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <p className="text-sm font-semibold text-fd-primary">{copy.chooseEyebrow}</p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-4xl break-keep">
            {copy.chooseTitle}
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {copy.choices.map((choice, index) => (
              <article key={choice.question} className="rounded-3xl border border-fd-border bg-fd-card p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-fd-primary">0{index + 1}</span>
                  <h3 className="text-lg font-semibold tracking-tight break-keep">{choice.question}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-fd-muted-foreground sm:text-base break-keep">
                  {choice.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
