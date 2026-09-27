import { getPageImage, source } from '@/lib/source';
import {
  DocsBody,
  DocsPage,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { StoreLanding } from '@/components/landings/store-landing';
import { PackageLanding } from '@/components/landings/package-landing';
import { getLandingPackage } from '@/components/landings/landing-packages';
import { PublishedStoreLanding } from '@/components/landings/published-store-landing';
import { StoreVersion } from '@/components/landings/store-version';
import { getStoreDocsChannel, isDevelopmentDocs, isStoreIndex, scopeStoreNextLink } from '@/lib/store-publication';

export default async function Page(props: { params: Promise<{ lang: string; slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug, params.lang);
  if (!page) notFound();

  const channel = getStoreDocsChannel(params.slug);
  const lang = params.lang === 'ko' ? 'ko' : 'en';
  if (isStoreIndex(params.slug)) {
    return channel === 'released' ? <PublishedStoreLanding lang={lang} /> : <StoreLanding lang={lang} />;
  }
  const landing = params.slug?.length === 1 ? getLandingPackage(params.slug[0]) : undefined;
  if (landing) {
    return <PackageLanding info={landing} lang={params.lang === 'ko' ? 'ko' : 'en'} />;
  }

  const MDX = page.data.body;
  const RelativeLink = createRelativeLink(source, page);
  const relativeSlug = channel === 'next' ? page.slugs.slice(2) : page.slugs.slice(1);
  const releasedPage = source.getPage(['store', ...relativeSlug], lang);
  const nextPage = source.getPage(['store', 'next', ...relativeSlug], lang);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: 'clerk' }}
      tableOfContentPopover={{ style: 'clerk' }}
    >
      {channel ? <StoreVersion lang={lang} channel={channel}
        releasedHref={releasedPage?.url ?? `/${lang}/store`}
        nextHref={nextPage?.url ?? `/${lang}/store/next`} /> : null}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: ({ href, ...props }) => <RelativeLink {...props} href={isDevelopmentDocs(params.slug) ? scopeStoreNextLink(href) : href} />,
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ lang: string; slug?: string[] }> }): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug, params.lang);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    robots: isDevelopmentDocs(params.slug) ? { index: false, follow: false } : undefined,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
