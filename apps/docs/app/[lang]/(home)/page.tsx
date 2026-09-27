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
              <Link
                href={`/${lang}/store`}
                className="inline-flex min-h-11 items-center rounded-full border border-fd-border bg-fd-background/80 px-5 py-2.5 text-sm font-semibold outline-none transition-colors hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring"
              >
                {copy.introduction}
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-fd-border bg-fd-card shadow-xl shadow-black/5">
            <div className="border-b border-fd-border px-5 py-5 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fd-primary">
                {copy.exampleLabel}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight break-keep">{copy.exampleTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-fd-muted-foreground break-keep">{copy.exampleBody}</p>
            </div>
            <div className="overflow-x-auto bg-neutral-950 p-5 text-[13px] leading-6 text-neutral-200 sm:p-6">
              <pre><code><span className="text-fuchsia-300">import</span>{' { Store } '}<span className="text-fuchsia-300">from</span>{' '}<span className="text-emerald-300">'@ilokesto/store'</span>{';\n\n'}<span className="text-fuchsia-300">const</span>{' counter = '}<span className="text-fuchsia-300">new</span>{' Store({ count: '}<span className="text-amber-300">0</span>{' });\n\ncounter.subscribe(() => {\n  console.log(counter.getState().count);\n});\n\ncounter.setState(({ count }) => ({\n  count: count + '}<span className="text-amber-300">1</span>{',\n}));'}</code></pre>
            </div>
            <div className="flex flex-col gap-4 border-t border-fd-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="font-mono text-sm">
                <span className="mr-3 font-sans text-xs font-medium text-fd-muted-foreground">{copy.result}</span>
                <span aria-hidden="true" className="text-fd-muted-foreground">› </span>1
              </p>
              <Link
                href={`/${lang}/store/quick-start`}
                className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
              >
                {copy.quickStart}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
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
