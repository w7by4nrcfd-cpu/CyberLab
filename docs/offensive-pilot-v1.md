# Offensive Security Pilot v1

Baseline: Version 49 (`06a7ae016fb6de88ab196d42cad80b0235f6c296`). One bounded access-control assessment, not an offensive track or general reconnaissance engine.

## Experience

Before: the Offensive direction contained 19 scoped references; the existing HTTP lab compared authentication/session responses without an end-to-end authorization assessment.

After: `/labs/v2/v2-access-control` presents authorization → reconnaissance → observation → hypothesis → safe test → bounded impact → remediation/retest → result. One primary action per stage. The existing beginner Mission-First journey is unchanged.

The learner represents Sara's existing NexaCorp account in a separate fictional training app. The policy permits reading only the account owner's reports. The authorized scope contains two read-only pages and two synthetic reports: R-104 (Sara) and R-205 (Layla). Three fixed requests compare Sara's own report, an anonymous request and Sara's request for Layla's report. No arbitrary request URL, credential, command, network address or external target is accepted.

A successful assessment must distinguish authentication from resource authorization, correlate the three observations, restrict the demonstrated impact to confidentiality, choose server-side authorization and retest owner/other/anonymous access (200/403/401). Hiding a link alone does not remediate the simulated response. The vulnerability name is disclosed only after successful completion.

## Existing content reused

| Existing ID | Role |
|---|---|
| v2-http | Prerequisite: compare requests, responses and simulated sessions |
| security-6 | Prerequisite and on-demand card: authentication vs authorization |
| web-security-7 | Object-level access and server-side control cards |
| web-security-12 | Why client-side restrictions need request-level verification |

Cards are optional, appear at the relevant investigation stage, and link to the original lesson IDs. An exact same-origin return allowlist returns to the Pilot; the stored server-side stage remains authoritative. No lessons are duplicated or reclassified.

## Company and persistence

- New asset: `access-training`, an explicitly isolated simulated reports app. It is not deployed on WEB-01 and has no new server, IP, service, account, credential or employee. Existing Sara/Layla employee/account IDs are referenced unchanged.
- The Pilot is one new HTTP-kind lab definition (`v2-access-control`). A scenario adapter dispatches its actions from the existing interactive-lab workflow; the five existing lab definitions and action branches retain their behavior.
- Its state is an optional `assessment` object in the existing `interactive_lab_progress.session_json`: stage, authorization acknowledgement, inspected pages, hypothesis, immutable generated traces, impact/evidence selection, remediation and retests.
- Completion, attempts and best result use existing lab columns. XP and Skill XP use the existing reward ledger/statements: 75 XP, 25 cybersecurity Skill XP and 10 logs Skill XP, once for this new lab ID. Replay keeps the original completion and does not create a new reward source.
- No database schema or migration is added. No production records are edited or seeded.

## Unlock and discovery

The existing completion records supply two requirements: complete `security-6` (quiz or reading completion) and `v2-http`. API writes independently enforce these requirements. Locked users can see the title, reason, count and next requirement; deep links return a real page, not a 404. A saved Pilot completion remains accessible if prerequisite rows are subsequently incomplete.

Labs and Search render its lock state; locked content is not a primary lab recommendation. Search indexing and Cyber Core/Supporting/Additional classification are unchanged. The new lab automatically uses existing reference relationships for discovery.

The focused workspace also applies to full-lesson references opened from this Pilot; existing Mission-First routes and behavior are preserved.

## Explicitly excluded

No full Offensive track, external scanning, real shell, exploit framework, AI pentesting, additional vulnerabilities, flags/CTF system or general recon engine. No changes to Career, Skill XP, Mastery or existing lesson/mission/lab IDs. Investigation Board, Evidence Locker and Dynamic Incidents are not rebuilt.

## Verification

- Final Build and TypeScript check passed; all 26 regression suites passed.
- The new suite compiles the real Pilot, Lab catalog and Search components against the built Worker and isolated D1. It executes the full journey, a wrong hypothesis/recheck, an unsupported impact, failed client-only remediation and successful server-side remediation/retest.
- Verified one primary action across the working stages, knowledge-card/full-lesson return, immutable/deduplicated traces, exact request allowlist, denied out-of-scope actions, server-side stage guards, locked users/search/deep links, old account progress, saved completed access, refresh/restart/account isolation, and both replay and concurrent submissions without duplicate XP/Skill XP.
- The test uses the existing HTTP lab to unlock the Pilot. Historical records are compared before/after; only the new lab state/reward source is added on successful completion. Existing Mission-First, curriculum scope, all old lab types, SOC, Board, incidents, Skill/Mastery/Career and persistence suites remain passing.
- A new-Pilot display bug was corrected: the Lab catalog now recognizes its saved in-progress state before a final graded attempt and offers Continue. The previous five labs' status interpretation is unchanged.
- Authentication code, D1 schema/migrations, Mission-First workspaces, lesson definitions/IDs, Learning Map/scope registry, reward statements, Skill/Mastery/Career formulas and old company entities remain unchanged from Version 49. Shared route/shell changes are limited to this Pilot and its reference return context.
- No actual production account, real OAuth sign-out/sign-in, browser render or physical iPhone/Safari test was available. Authenticated-header tests exercise persistence and isolation locally; they do not prove a real OAuth round trip. RTL attributes and responsive CSS were checked without a rendered-device claim.

Educational validation references: [OWASP API1:2023 — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/) and [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). These support resource-level/server-side permission checks; no target from those sources is part of the simulation.
