# CyberLab63 — Phase 7 reliability checkpoint

Scope: selected `cyberlab63` Site only. No V55, V64/65 or GitHub backup changes.

## Source recovery checkpoint before this change

- Site: `appgprj_6ac145fc65e481919c05cc5b4a730aac`.
- Saved version: 11.
- Exact saved ID: `appgprj_6ac145fc65e481919c05cc5b4a730aac~appgver_b10adb6bc3f4819188753a4d25450185`.
- Source commit: `eabe18c19ad62c197cefffbc86486df31236a6fd`.
- The saved version has an uploaded build archive. This is a code/build checkpoint, NOT a D1 data backup.
- Do not redeploy or restore automatically. Verify the intended same Site/version and runtime compatibility, obtain explicit rollback approval, then use the native Sites saved-version deployment operation. No rollback was executed here.
- Redeploying older code does not restore deleted/changed learner data. Do not run migrations or SQL restore as part of code rollback.

## Implemented reliability changes

- Progress and learning load concurrently and are applied together after shape validation.
- Reads bypass browser caches, cancel superseded requests and ignore late responses.
- Account transitions immediately mask the previous account before new requests complete.
- Failed refresh retains the last known data with an explicit error; it does not invent zero progress.
- Requests have a 15-second limit and clear Arabic connectivity/session messages.
- Writes are sent once, with no automatic replay on uncertain outcomes.
- A confirmed write followed by a failed read reports that distinction to the learner.
- Progression reads use the same bounded transport and cancel stale requests.
- No schema, migration, reward, authentication-provider or server authorization changes.

## Verification commands

`node tests/saved-progress.test.mjs` exercises the real request helper and React hook logic with controlled delayed responses. It covers timeout, malformed responses, overlapping refresh, account changes, recovery, and confirmed-write/failed-refresh behavior. It is not a browser/OAuth test.

Before publishing, run TypeScript checking, the Site build, and `node tests/security-readiness.test.mjs`. The security suite uses a temporary local database and simulated trusted platform identity, not live users or live D1.

## Remaining operational gates — not claimed complete

1. D1 backup and recovery: supported tools expose table inspection, not a consistent database snapshot/export/restore operation. No learner data was exported, no live backup was created, and no restore drill was performed.
2. Hosting WAF/rate limiting: no supported rule-management surface was available. Handling HTTP 429 in the client is NOT server-side rate limiting.
3. Real OAuth/session expiry and trusted-header enforcement must be verified at the hosting boundary. Local simulated identities do not establish these properties.
4. iPhone/Safari visual and interaction checks remain outstanding from phase 6.
5. No live load test or performance benchmark was run. Cancelling stale requests is a concrete efficiency change, not a measured speed claim.

Do not mark phase 7 fully closed, or claim production security certification, until these gates have appropriate evidence. A full backup needs an authorized hosting export plus a restore test in an isolated environment; restoring into the live Site is not the first test.
