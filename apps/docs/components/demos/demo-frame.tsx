import type { ReactNode } from 'react';

export type DemoProps = { readonly lang: 'en' | 'ko' };

export const demoButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background disabled:cursor-not-allowed disabled:opacity-50';

export const demoSecondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:cursor-not-allowed disabled:opacity-50';

export const demoInputClass =
  'min-h-11 w-full rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

export function DemoFrame({
  lang,
  name,
  title,
  description,
  code,
  children,
}: DemoProps & {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      data-demo={name}
      aria-label={title}
      className="not-prose my-8 min-w-0 overflow-hidden rounded-2xl border border-fd-border bg-fd-card"
    >
      <div className="border-b border-fd-border px-5 py-5 sm:px-6">
        <p className="mb-2 text-xs font-semibold text-fd-muted-foreground">
          {lang === 'ko' ? '직접 사용해 보기' : 'Try it here'}
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-fd-foreground break-keep">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-fd-muted-foreground break-keep">{description}</p>
      </div>
      <div className="min-w-0 space-y-5 bg-fd-background/60 p-5 sm:p-6">
        {children}
      </div>
      <div className="min-w-0 border-t border-fd-border">
        <p className="px-5 pt-4 text-xs font-medium text-fd-muted-foreground sm:px-6">
          {lang === 'ko' ? '이 예제의 핵심 코드' : 'The code behind this example'}
        </p>
        <pre tabIndex={0} aria-label={lang === 'ko' ? '예제 코드' : 'Example code'} className="max-h-80 overflow-auto p-5 text-xs leading-6 text-fd-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fd-ring sm:px-6">
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
}
