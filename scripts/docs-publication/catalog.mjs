export const RELEASE_COMMIT = 'ecd9709b76d1976ec86865314e85b916f220c818';

// Audited against the exact-version registry records and Publish run 36302267041.
// These releases have NO npm gitHead or source-provenance attestations.
export const RELEASES = Object.freeze(Object.fromEntries([
  ['store', '2.0.0', 'latest', 'ezW/FizFYp6yV/cwdIi7KrDN01sSRS38CC48ozkwm6UyIs0N7dNjaWaZOlVmZCieHWm9pQKxD1Z+7EVnYet82A==', '26f0dd70ed6eae748b19d066177b9215f33fd1cf'],
  ['state', '2.0.0', 'latest', 'GOg2Ovmq8qqqQfozizHhQ4hV+kWQ8DmmYmKsQJCMOZpAfG2nDqt5j8sl2jMJ0PdHWr13UJQ+ZQpTDH8Qy5m7IQ==', '0857ea83168d0963cd10b34569a35a6f875aa69b'],
  ['form', '2.0.0', 'latest', '+cwHb++t/kuCd8j1IHngHzlTx79GLKlaAjPJPyCvyl96FogzGkV+PYU7zWHntMj0i9RXumGYsw3fC4X6EPwMuQ==', '4e259ded6563a50ea41d0ad245ff78a669065554'],
  ['overlay', '2.0.0', 'latest', 'g3nHsweF+cl51vG95oq+C0dE5WA+G2HAXBrnrBUq5IdU2NfkiQ1EbWEsELl1/EPMFwsfnOiguaC0vT8PB/Z/sg==', 'b1c16ee0772aebfea47770759910f1f02a4e644f'],
  ['modal', '2.0.0', 'latest', 'ORXDt6x2uJPFGu2CZgsNM+mLonzhpFfZH8d7/oSS7gTEmIsLaxMdfyXldb5gsDLNT1UxJyOVfrgkEU7af8ckQw==', '8c48d81d3b1d6d371989bda2200a26821a7c0fd5'],
  ['toast', '2.0.0', 'latest', 'n9nRqwC97SN/8ruE5mguRiT5EWg+Qi57zEAvx7tbkPoyhP9FbRAVDAJKq2+kOUrWTn2WpAei6zMMCxV20c9G9g==', 'c3ff43ba360db7db09b41da194b3cc230470b16f'],
  ['fetcher', '1.0.0', 'beta', 'fzhRTXxkss9U9hwcxx4iJ9a2pStg4pBPQOvw3g3xdoR3wHoY+DF1mBFRTV5yVo/bQf9giuYF1SdPiULqxt3k9A==', '32bb8477d80a4cdeddc5d555c451ece383ec4daa'],
  ['utilinent', '1.2.0', 'latest', 'qyiB9JvHFqX/eIYz3CXEI5BNJ87dGTMWTAxsnkfOGn9bX5l3QsKKa40ZMqOxCel3lPn1bbU0iFbdLNS4OmXI7A==', 'c71af0b0bb71c214a76f4fef0efee90f6d1e2a1c'],
].map(([slug, version, channel, digest, docsTree]) => [slug, Object.freeze({
  name: `@ilokesto/${slug}`, version, channel, integrity: `sha512-${digest}`, docsTree,
  tarball: `https://registry.npmjs.org/@ilokesto/${slug}/-/${slug}-${version}.tgz`,
})])));

export const PACKAGE_NAMES = Object.freeze(Object.keys(RELEASES));
export const PROVENANCE = Object.freeze({
  kind: 'operational-evidence-not-cryptographic-source-provenance',
  report: 'release-provenance.md',
  observedAt: '2026-09-27',
  publishRun: 'https://github.com/ilokesto/ilokesto/actions/runs/36302267041',
  publishCheckout: RELEASE_COMMIT,
  npmGitHead: null,
  npmAttestations: null,
  evidence: [
    'The successful workflow checked out this commit; all eight annotated release tags peel to it.',
    'Both shipped READMEs match source blobs; packed manifests differ only by workspace protocol rewrites.',
    'The audit compared all published dist bytes with matching builds, including a fresh Fetcher build.',
  ],
  limitation: 'npm exposes neither gitHead nor source provenance attestations for these versions. Workflow, tags, and byte comparisons support the source association but do not cryptographically prove it.',
});

// Append new audited versions here; never replace an older version's trust
// anchor. Different packages may reference different publication commits.
const initialReleases = Object.fromEntries(
  Object.values(RELEASES).map(release => [`${release.name}@${release.version}`, Object.freeze({
    ...release,
    releaseCommit: RELEASE_COMMIT,
    reportSha256: '374af7f4df1dd24d2e34aefb96656f779dbbbae0f6890cc817239b975fb29343',
    provenance: PROVENANCE,
    ...(release.name === '@ilokesto/state' ? {
      timestampAnomaly: 'The registry publication time is 3m52s after the sole workflow completed. The audit could not reconcile this timing; source attribution remains operationally supported, not provenance-proven.',
    } : {}),
  })]),
);

export const RELEASE_CATALOG = Object.freeze({
  ...initialReleases,
  // Add independently audited name@version records without removing old ones.
});

export function auditedRelease(entry) {
  const release = RELEASE_CATALOG[`${entry.name}@${entry.version}`];
  if (!release || release.releaseCommit !== entry.releaseCommit) {
    throw new Error(`Docs publication: unaudited release ${entry.name}@${entry.version}`);
  }
  return release;
}
