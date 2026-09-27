import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { demoBehaviors } from './demo-behaviors.mjs';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('../', import.meta.url));
const packages = ['store', 'state', 'form', 'overlay', 'modal', 'toast', 'utilinent', 'fetcher'];
let server;
let origin;
let browser;

before(async () => {
  await new Promise((resolve, reject) => {
    server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', '0'], {
      cwd: appRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    const timeout = setTimeout(() => reject(new Error(`Docs server did not start:\n${log}`)), 20_000);
    server.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    server.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Docs server exited with ${code}:\n${log}`));
    });
    const onData = (chunk) => {
      log += chunk.toString();
      const address = log.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (address && log.includes('Ready in')) {
        origin = address[0];
        clearTimeout(timeout);
        resolve();
      }
    };
    server.stdout.on('data', onData);
    server.stderr.on('data', onData);
  });
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  if (!server || server.exitCode !== null) return;
  await new Promise((resolve) => {
    server.once('exit', resolve);
    server.kill('SIGTERM');
  });
});

for (const lang of ['en', 'ko']) {
  test(`${lang} homepage switches its shared palette in dark mode`, async () => {
    const page = await browser.newPage({ colorScheme: 'light' });
    try {
      await page.goto(`${origin}/${lang}`);
      const content = page.locator('main').last();
      const lightBackground = await content.evaluate(element => getComputedStyle(element).backgroundColor);
      await page.getByRole('button', { name: 'Toggle Theme' }).click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(content).not.toHaveCSS('background-color', lightBackground);
    } finally {
      await page.close();
    }
  });

  for (const packageName of packages) {
    test(`${lang}/${packageName} index runs its real interactive example`, { timeout: 30_000 }, async () => {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.goto(`${origin}/${lang}/${packageName}`);
        await expect(page.locator(`[data-landing="${packageName}"]`)).toBeVisible();
        await expect(page.locator('#nd-sidebar')).toHaveCount(0);
        await expect(page.locator(`[data-demo="${packageName}"]`)).toBeVisible();
        await demoBehaviors[packageName](page);
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  }
}

test('demo HTTP service returns deterministic success and error payloads', async () => {
  const success = await request('/api/demo/fetcher?outcome=success');
  assert.equal(success.status, 200);
  assert.equal((await success.json()).source, 'fictional-demo');
  const failure = await request('/api/demo/fetcher?outcome=error');
  assert.equal(failure.status, 503);
  assert.equal((await failure.json()).error.code, 'DEMO_UNAVAILABLE');
  assert.equal(failure.headers.get('cache-control'), 'no-store');
});

test('package landings preserve illustration, locale and documentation routes', { timeout: 60_000 }, async () => {
  const page = await browser.newPage();
  try {
    for (const name of packages) {
      const illustration = await request(`/illustrations/${name}-workshop.webp`);
      assert.equal(illustration.status, 200, name);
      assert.match(illustration.headers.get('content-type'), /image\/webp/);
      assert.equal(illustration.redirected, false);
      await page.goto(`${origin}/en/${name}`);
      await expect(page.locator('#nd-sidebar')).toHaveCount(0);
      await Promise.all([
        page.waitForURL(`${origin}/ko/${name}`),
        page.locator('header a[hreflang="ko"]').click(),
      ]);
      await expect(page.locator(`[data-demo="${name}"]`)).toBeVisible();
      await Promise.all([
        page.waitForURL(`${origin}/ko/${name}/quick-start`),
        page.locator(`header a[href="/ko/${name}/quick-start"]`).click(),
      ]);
      await expect(page.locator('#nd-sidebar')).toBeVisible();
    }
  } finally {
    await page.close();
  }
});

test('toast notifications are removed when client navigation unmounts the demo', { timeout: 30_000 }, async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${origin}/en/toast`);
    await page.locator('[data-demo-action="toast-success"]').click();
    await expect(page.locator('[data-demo-toast="success"]')).toBeVisible();
    await Promise.all([
      page.waitForURL(`${origin}/en`),
      page.getByRole('link', { name: 'ilokesto', exact: true }).click(),
    ]);
    await expect(page.locator('[data-demo-toast]')).toHaveCount(0);
    await page.locator('h4 a[href="/en/toast"]').click();
    await expect(page.locator('[data-demo="toast"]')).toBeVisible();
    await expect(page.locator('[data-demo-toast]')).toHaveCount(0);
  } finally {
    await page.close();
  }
});

const request = (path) => fetch(`${origin}${path}`, { signal: AbortSignal.timeout(10_000) });

test('every canonical bilingual page is served from the production build', { timeout: 30_000 }, async () => {
  const routes = [];
  for (const name of packages) {
    const files = await readdir(new URL(`../../../packages/${name}/docs/`, import.meta.url), { recursive: true });
    for (const file of files.filter((file) => file.endsWith('.mdx'))) {
      const lang = file.endsWith('.ko.mdx') ? 'ko' : 'en';
      const slug = file.replace(/(?:\.ko)?\.mdx$/, '').replace(/(^|\/)index$/, '');
      routes.push(`/${lang}/${name}/${slug}`.replace(/\/$/, ''));
    }
  }
  for (let offset = 0; offset < routes.length; offset += 12) {
    await Promise.all(routes.slice(offset, offset + 12).map(async (route) => {
      const response = await request(route);
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get('content-type'), /text\/html/);
      const html = await response.text();
      for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
        const target = new URL(href.replaceAll('&amp;', '&'), `${origin}${route}`);
        if (target.origin !== origin || !/^\/(?:en|ko)\//.test(target.pathname)) continue;
        assert.ok(routes.includes(target.pathname.replace(/\/$/, '')), `${route} links to missing ${target.pathname}`);
      }
    }));
  }
});

test('home navigation and search expose every package in both languages', async () => {
  for (const lang of ['en', 'ko']) {
    const home = await (await request(`/${lang}`)).text();
    for (const name of packages) {
      assert.ok(home.includes(`href="/${lang}/${name}"`), `${lang}/${name}`);
      assert.ok(home.includes(`href="/${lang}/${name}/quick-start"`), `${lang}/${name}/quick-start`);
      const intro = await (await request(`/${lang}/${name}`)).text();
      assert.ok(intro.includes(`href="/${lang}/${name}/quick-start"`), `${lang}/${name} has no quick-start link`);
      const quickStart = await request(`/${lang}/${name}/quick-start`);
      assert.equal(quickStart.status, 200, `${lang}/${name}/quick-start`);
      await quickStart.arrayBuffer();
    }
    const response = await request(`/api/search?query=store&locale=${lang}`);
    assert.equal(response.status, 200);
    const results = await response.json();
    assert.ok(results.length > 0);
    assert.ok(results.every((result) => result.url.startsWith(`/${lang}/`)));
  }
});

test('Markdown and image handlers preserve the requested locale without redirects', async () => {
  for (const lang of ['en', 'ko']) {
    const markdownPath = `/llms.mdx/docs/${lang}/store/content.md`;
    const markdown = await request(markdownPath);
    assert.equal(markdown.status, 200);
    assert.equal(markdown.url, origin + markdownPath);
    assert.match(markdown.headers.get('content-type'), /text\/markdown/);
    assert.ok((await markdown.text()).includes(`(/${lang}/store)`));
    const image = await request(`/og/docs/${lang}/store/image.webp`);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), 'image/webp');
    assert.ok((await image.arrayBuffer()).byteLength > 0);
  }
  for (const path of ['/llms.txt', '/llms-full.txt']) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.equal(response.url, origin + path);
    assert.match(response.headers.get('content-type'), /text\/plain/);
    await response.arrayBuffer();
  }
});
