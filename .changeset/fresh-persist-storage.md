---
"@ilokesto/state": patch
"@ilokesto/store": patch
---

Rebuild persist around configured storage factories, explicit asynchronous
rehydration, commit-aware saving, conflict resolution, flush and cleanup. Add JSON,
cookie and native IndexedDB adapters that preserve structured values and await
transaction completion.

This intentionally replaces the previous local/session/cookie options and
hydration controls. Follow the English or Korean persist migration guide.
The patch release for this breaking v2 correction is explicitly authorized in
issue #102. Store gains generic commit observation and immediate replacement;
state's workspace dependency resolves to the matching Store release at publication.
