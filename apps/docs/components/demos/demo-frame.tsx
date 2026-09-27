import type { ReactNode } from 'react';
import styles from '../landings/store-landing.module.css';

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
      className={styles.sceneDemo}
    >
      <div className={styles.sceneControls}>
        <h2 className={styles.sceneTitle}>{title}</h2>
        <p className="sr-only">{description}</p>
        <div className="space-y-4">{children}</div>
      </div>
      <div className={styles.codePanel}>
        <div className={styles.codeHeader}>
          <span>{name}.tsx</span>
          <span>{lang === 'ko' ? '핵심 코드' : 'Core snippet'}</span>
        </div>
        <pre tabIndex={0} aria-label={lang === 'ko' ? '예제 코드' : 'Example code'} className={styles.sceneCode}>
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
}
