# Dynamic Incidents v2 — review candidate

Baseline: Version 61 Candidate (`b60bdc5d96ae9d1473f233beefc8b1efdd4aba10`). Production stays Version 55. No deployment, migration, NexaCorp identity changes, economy changes, or Beta Gate changes.

## Before / after

Before: the three existing templates varied actors, addresses and process labels, but every independent variant had an incident conclusion. Required sources and relationships were mostly fixed, and a wrong decision could reveal the full review. The generic board exposed all raw evidence at once.

After: the same templates support structured, deterministic evidence variation. Email and endpoint cases can be unauthorized or approved activity. Authentication cases can also be a rejected attempt without a successful session. The conclusion, action and correct relationships follow each immutable snapshot's facts. A focused view reveals one source, collection, documented relationships, structured decision and result in sequence. Incorrect conclusions retain evidence and offer re-check guidance without the full answer.

## Architecture and reuse

- `lib/dynamic-incidents.ts`: existing generator, extended with an explicit generation version. Default v1 remains for existing connected chains; new incident API creations use v2. Saved v1 snapshots are read as saved, never regenerated.
- `lib/dynamic-variation.ts`: versioned variation helper and invariant validation. No parallel engine, LLM generation, external requests or arbitrary targets.
- `lib/dynamic-storage.ts`: existing snapshot, active pointer and history tables. Atomic variant numbering/cap in the existing D1 batch. Resume returns the same immutable instance even if a different difficulty is selected.
- `lib/investigation-storage.ts`: existing review, collection, notes, relationships, decisions and ownership queries. Private expected answers and variation metadata stay server-side. V2 raw evidence is revealed on review; required/distractor roles and full review are hidden until successful closure. Exact affected scope and correlation are required. A concurrent incorrect decision cannot reopen a correctly closed v2 case.
- `app/investigations/[id]/dynamic-workspace.tsx`: existing Mission-First CoreFrame, draft/step persistence helpers, knowledge component and progression summary. Uses existing investigation APIs. Legacy board view remains for old cases.
- `lib/dynamic-presentation.ts`, lesson return adapter, shell focus condition and scoped CSS: existing lesson references and safe return context; no navigation rebuild or global header changes.

## Controlled variation

Four existing employees (Layla, Sara, Adam, Maya) and their canonical account, email, department, first device, office IP and segment. Existing MAIL-01, IDP-01, WEB-01 or FILE-01 services remain consistent. External sources use only RFC 5737 documentation addresses; links use reserved `.example` domains.

Varied facts include approval status, session result, parent/child process, PID, signature, change identifier, artifact identifier, destination/service, message domain/provider, timestamps, source order and relevant distractors. Event order is shuffled for exploration; the timeline remains chronological. Advanced distractors may concern the same account/device at an earlier time with a different event identifier.

The learning objective stays fixed per template:

1. Email: correlate message origin with identity and browser events.
2. Endpoint: correlate process, file and connection with approved change context.
3. Authentication/network: distinguish transport from a successful authenticated session.

A seed feeds deterministic integer PRNGs. Its existing upper bits specify difficulty. Same template + seed + generation version reproduces the incident. Crypto randomness is used only when explicitly creating a new variant; Refresh and resume never generate one.

## Evidence integrity and solvability

Creation and v2 snapshot reads validate company ownership relationships, office IP, department/segment, service/server assignment, unique evidence/events and board references, raw structured records, chronological and causal order, required source availability, PID/artifact/message correlation, approved policy consistency, scope, conclusion/action and proof relationships. Invalid snapshots fail closed.

Beginner: two required sources and two proof links, clear guidance; other relevant context is optional. Intermediate: three required sources and three proof links, more distractors and less guidance. Advanced: four required sources, same-account distractor, optional directory context and no primary guidance. Essential evidence is always available. Difficulty does not hide facts.

Replay reopens the same instance while preserving evidence, notes and links. New variant creates a separate snapshot and keeps the old one accessible. Existing dynamic investigations grant no XP or Skill XP; that remains unchanged. Existing achievements normalize dynamic completion by template, so variants do not multiply the same progression proof.

## Automated verification

- Build and Type Check: passed.
- Existing 36 regression files plus new Dynamic Incidents v2 suite: 37/37 passed.
- 600 distinct seeds across three templates: 1,800 v2 instances generated twice, compared and graded from available evidence. Distribution: 872 incident, 810 approved, 118 blocked. All difficulties and all four actors represented.
- Negative invariant mutations: ownership/IP, event timestamp, raw evidence, expected conclusion and missing required evidence rejected.
- Seven actual built Worker investigation flows in disposable local D1: true/approved cases for all three templates plus blocked authentication. Wrong hypothesis, hidden solution, duplicate evidence/links, invalid relationships, notes, correct conclusion, concurrent correct/incorrect submissions, reopening and replay.
- Worker restart restores saved case, evidence, relationships and decision exactly (excluding ephemeral response message).
- Built API new creation/resume and simultaneous new variants; unique variant numbers.
- Local account A/B isolation, unauthorized 401 and other-account 404. This is not Production isolation proof.
- Old v1 snapshot compatibility; existing XP 340 preserved and no Skill XP added. Investigator achievement count normalizes seven cases to three template proofs.

## Browser verification — actual Chrome, local fixtures

Completed four v2 cases:

| Case | Seed | Observation / decision |
|---|---:|---|
| Endpoint, unauthorized | 1073751124 | Adam / WIN-07; outlook → wscript; unsigned file; external connection. Wrong routine decision rejected; re-check then contain succeeds. |
| Endpoint, approved | 1073778652 | Layla / WKST-02; explorer → wscript; signed artifact and matching approved WEB-01 destination. Repeating the previous contain decision fails; monitor succeeds. |
| Authentication, blocked | 1073806180 | Maya / WKST-05; transport established but success=0 / session denied. Rejected-attempt conclusion and monitor succeed. |
| Email, approved, zero user | 0x218e0093 | Adam; message origin, browser, SSO provider and device match approved context. Correlated routine conclusion succeeds. |

Also checked: full lesson `soc-3` return to the same process source; refreshed endpoint at saved observe/context URL with three collected sources and relationships retained; same-incident replay; explicit new variant (0x0d440d60) retains prior email case and opens a new Sara case. Wrong decisions do not reveal review.

Evidence and decision screens measured and visually inspected at 375 / 390 / 402 / 430px and Desktop 1280px. Document `scrollWidth === clientWidth` in all measured states. Desktop scrollbars leave client widths 360 / 375 / 387 / 415 / 1265 respectively. Technical raw evidence remains LTR within Arabic RTL; native selects, notes and labels use existing touch-friendly primitives. Full flow on 375px and 402px; representative screens at other widths. Screenshots under `docs/qa/dynamic-v2/`.

## Proven fixes

- Existing generator's minute wrap could reverse timeline when offsets crossed an hour; Date arithmetic now carries the hour.
- V2 wrong decisions no longer disclose the full review.
- V2 concurrent decision updates guard open status, preventing incorrect overwrite after closure.
- Variant number/cap allocated atomically to avoid concurrent numbering collision.
- Browser-discovered full-lesson return separator fixed before final verification.
- New email brief uses gender-neutral Arabic; no legacy lesson rewrite.

## Limits

No real iPhone/Safari, mobile hardware keyboard, Production OAuth, Production D1, Production A/B, Cloudflare rules or backup restore were tested. Browser tests use synthetic accounts and disposable local D1; no Production credentials or data. Browser widths are CSS iframe viewports, not WebKit device emulation. Not every one of the 1,800 variants was completed manually. Advanced difficulty is tested automatically and represented by invariant checks, not a full manual advanced journey. No new offensive/SOC content, incident history dashboard or new reward mechanism added.

Beta Gate remains exactly as documented. Version 61 remains the rollback candidate. Stop for review; do not deploy or begin another stage.
