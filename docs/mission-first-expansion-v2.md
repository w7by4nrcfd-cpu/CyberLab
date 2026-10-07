# Mission-First Expansion v2 — Version 56 Candidate

Production baseline: Version 55. This candidate is saved without deployment. The existing Beta Gate record is unchanged: Production OAuth and iPhone/Safari PASS by owner verification; Production account isolation, WAF/rate limiting and separate recovery proof BLOCKED. Local tests below do not upgrade those statuses.

## Implemented scope

One connected response chain, `identity-follow-up`, at `/experience/nexacorp-response`, with three investigations:

1. **رسالة ثانية ونشاط الحساب** — existing phishing template, beginner guidance. Correlate the email and identity event; decide whether to contain or escalate the account.
2. **أثر على جهاز المالية** — existing endpoint template, intermediate guidance. Correlate the parent process, child process and network activity; identify account/device impact. Account response does not prove device safety.
3. **هل نجحت الاستجابة؟** — existing network/authentication template, advanced guidance. Check authentication results against network flow and the known office session. Account containment produces denied retries; escalation alone leaves successful suspicious authentication. Endpoint isolation does not revoke a remote account session.

All stages use existing NexaCorp IDs: Leila/`layla`, `WKST-02`/`192.0.2.42`, `MAIL-01` and `IDP-01`. External-looking addresses are documentation-only simulated addresses. No external execution, scanning, credentials, targets or free-form commands are introduced.

## Architecture and persistence

`incident-chain.ts` is a data-driven chain definition and reference mapping. `incident-chain-definition.ts` adapts the three existing generators with consistent employee, source and time context. `incident-chain-storage.ts` orchestrates saved stages using the existing `dynamic_incidents` table; no second incident engine or migration.

Snapshots contain optional `chain` metadata: chain ID, stage, root seed, previous instance/action, account response and original SOC source. The root seed is derived server-side from chain ID plus the authenticated user ID. Stage-specific seed bits select the existing difficulty tier. A bounded collision check preserves unrelated existing variants. Clients cannot provide identities, seeds, previous decisions, XP or ownership.

Stage creation is an atomic `INSERT OR IGNORE … SELECT MAX(variant_number)+1`, protected by existing user/instance and user/template/variant uniqueness. Concurrent starts return the same instance and exactly one `created=true`. The generic `dynamic_active` pointer is untouched.

Evidence state, notes, classification, relationships and decisions use existing investigation APIs and tables. Raw evidence remains immutable. Links require valid entities, relationship types and a reason. A chain decision requires the required correlated sources and links, plus all affected entities for that stage. Wrong decisions keep the investigation open and show an observation and simulated consequence without revealing the answer review. Correct completion reveals the review and one next step.

Saved snapshots are immutable. Refresh/reopen reuses the same instance. Later stages preserve the handoff and response that existed when created; replaying an earlier stage does not silently regenerate or rewrite an already saved later stage.

Unlock: correct closed `SOC-002` → first stage → correctly completed previous stage → next stage. Existing saved stages retain access during replay. Existing completed SOC progress is recognized; users are not forced to repeat it. Direct locked URLs show the reason and the guided SOC prerequisite, not 404. The core journey's final next action now leads to this chain, then returns to Progress after all three stages.

## Reuse and user experience

Existing Mission-First frame, draft restoration, focus mode, dynamic incident templates, Board, Locker, SOC completion, request validation, account-scoped D1 storage and current progression are reused. No existing Lesson/Lab/Mission IDs or content definitions are replaced. No XP or Skill XP is awarded by the chain, consistent with the current investigation workspace policy; existing economy and duplicate-award architecture remain unchanged.

Each investigation discloses brief → source review/collection → relationships → hypothesis/decision → consequence. Knowledge cards appear only beside a relevant selected source or relationship stage. Full references reuse `security-8`, `security-5`, `soc-2`, `soc-3` and `net-3`; returning restores stage, step and selected evidence. The last stage removes the earlier guided correlation prompt. XP, Rank and Career do not compete with the task. Existing global navigation and Version 55 header remain intact.

## Verification performed

- Final Build: exit 0.
- Final Type Check (`npx tsc --noEmit`): exit 0; only an npm environment warning, no TypeScript errors.
- All **31 regression suite files**: exit 0, including the new expansion suite and all 30 baseline suites. Baseline Mission-First and offensive journeys, rewards, security guards, mobile layout and persistence suites passed.
- New suite: 39 deterministic three-stage chain sets, both account-response branches, entity/timeline consistency, required/supporting/distractor evidence, guest/zero-user locks, runtime input rejection, origin protection, concurrent starts, duplicate evidence, invalid/self relationships, persisted notes, wrong/recheck, all affected assets, stage unlocks, replay, D1 restart, local cross-account read/write rejection, preserved legacy investigations and reward/progress ledgers, and full lesson return URLs.
- **Actual Chrome browser on the built Worker with disposable local D1 and synthetic accounts:** zero-user Dashboard → existing Network Case; new chain's direct locked state; existing-progress account completed all three new investigations, source review/collection, documented links, wrong first decision → recheck → correct decision → consequence → later incidents → final result; full lesson return and Refresh restored the first saved result. No Production account was used or modified.
- Browser visual checks used same-origin iframes at exact CSS widths **375, 390, 402, 430 and 1280px**. Evidence and decision screens had no document horizontal overflow. Decision selectors were 48px, primary evidence actions 51px, secondary actions at least 44px; technical logs rendered LTR inside RTL and `bdi` isolated account/device labels. All four mobile evidence screenshots and Desktop decision screenshot were inspected. This is Chrome CSS viewport testing, not an actual iPhone/Safari or native keyboard test.

## Files

- New: `app/experience/nexacorp-response/{page,workspace}.tsx`, `app/api/incident-chains/route.ts`, `lib/incident-chain{,-definition,-storage}.ts`, `tests/mission-first-expansion.test.mjs`.
- Narrow integrations: `lib/dynamic-incidents.ts`, `lib/investigation-storage.ts`, `lib/mission-first-core.ts`, `lib/mission-first-pilot.ts`, `lib/request-validation.ts`, `app/experience/core-start.tsx`, `app/shell.tsx`, `app/incidents/view.tsx`, `app/operations/page.tsx`, scoped additions to `app/globals.css`, intentional next-step assertion in `tests/mission-first-core.test.mjs`.
- Development-only visual helper: `tests/helpers/expansion-visual-server.mjs`. It uses synthetic identity headers and temporary local D1, is not imported by app/Worker, and is not included in the deployment artifact. `package.json` remains unchanged.
- Screenshots: `docs/mission-first-expansion-v2/`.

## Limits and release boundary

Production OAuth, A/B account isolation, WAF, backup/recovery and actual iPhone/Safari were not tested in this phase. Existing-user compatibility is proven with local fixtures and regression tests, not a live Production account. Replay/concurrent starts are automated-test verified; the browser exercised the containment branch, while the escalation branch was exercised by the built-Worker tests. No real learner study or measured learning outcome is claimed.

The supervised visual preview stopped during the final build/restart; its temporary database is disposable. Previously captured screenshots and browser observations document the tested local build. Candidate source/build verification completed successfully. No Production writes, Auth changes, D1 migrations, Cloudflare changes or deployment were performed. No following phase has started.
