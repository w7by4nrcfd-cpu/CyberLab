# Final Learning & Product QA v1

Baseline: Version 51, source `8dd247a2ae5c6248f6c86c116156d9e9d42e1acf`.
Scope: educational flow and proven product bugs only. No new lessons, missions, labs, engines, migrations or dependencies.

## Verification method and limits

Actual workspace components were compiled and their rendered controls, links, handlers and effects were exercised against the built Cloudflare Worker and isolated Miniflare D1 databases. The beginner acceptance test starts at the actual Dashboard and follows the primary links emitted by the interface. It does not begin by opening an internal activity URL.

These tests simulate trusted identity headers and React hook/context boundaries. They are not browser interaction, real OAuth, visual viewport testing, a human novice study or an iPhone/Safari test. Browser control required by the Sites preview workflow was unavailable; no alternative browser automation was used. No real Production account activity was completed and no Production database values were edited during QA.

## Proven issues and fixes

| Issue | Before | After |
|---|---|---|
| Network knowledge timing | The card discussed IP while the decision required reading a /24 network mask. | The on-demand card explains the mask and the comparison needed for this case. |
| Defensive handoff | Email result could imply the next case was the identical message; the SOC handoff lacked a clear learning purpose. | Result copy distinguishes the next related case and explains the transition from message signals to account/session correlation. |
| Full reference mismatch | Authentication log cards in First Signal and SOC linked to `soc-3`, an endpoint/process reference. | Both use the existing authentication-log reference `soc-2`. |
| Full references add little value | Nine used references relied on a short definition/example plus a generic adjacent-concept comparison. | Existing references now explain observations, controlled comparisons, limits of proof and remediation/retesting. No IDs, questions, prerequisites or rewards change. |
| Knowledge return competes with quiz | The full lesson primarily led to a quiz and then the next lesson, losing the purpose of the visit. | When opened from a case/assessment, return to that activity is primary; quiz is optional and its result returns to the same context. Guest sign-in URLs retain the context. Standalone lesson flow remains available. |
| Required SOC check appears optional | A required time-analysis tool was under “additional check.” | It is explicitly required, opens when decisive sources are collected, and is the primary action until used. |
| Wrong SOC result dead end | Primary review sent the learner through a completed Board back to the still-closed SOC result. | Primary action starts the existing reopen/recheck flow. Evidence/workspace records and reward ledgers remain intact. |
| Dashboard misinterprets a wrong SOC closure | Any closed alert could advance the core journey and imply successful methodology. | The Dashboard reads the saved result and recommends reviewing an incorrect decision. This is a recommendation, not a new lock or completion rule. |
| Tool purpose unclear | Locker and Board could seem like extra panels to operate. | Copy distinguishes preserving source evidence from explaining entity relationships; Arabic names are consistent. |
| Started practice appears available | A saved lab with zero graded attempts was labelled available. | Catalog and Search recognise the saved state as in progress; completed and locked states keep precedence. |
| Lab progress counter | Interactive completions were counted against only the 14 legacy labs. | Both numerator and denominator use the actual 22 existing lab IDs. |
| Completed library next step | Exhausted cyber references could recommend starting a completed lesson again. | Dashboard acknowledges completed cyber references and points to existing Practice. |
| Offensive discovery is stale | Library copy said practical Offensive training had not been built. | Copy and a secondary reference link identify the existing three-assessment foundations. |
| Access Control context | Back label and guest sign-in could lose the mini-track context. | Label and return URL retain the existing Offensive track context without changing the assessment. |

The nine full references improved are `security-5`, `security-6`, `web-7`, `web-9`, `web-security-7`, `web-security-12`, `network-security-1`, `web-10` and `web-security-6`. Repeated generic comparisons were removed from these references. Repeated reinforcement in a new investigative context was retained where it serves a different decision.

## Journey coherence

| Stage | Learner action and learning | Logical next step |
|---|---|---|
| Dashboard / Network | One next action; compare device configuration, gateway and connection evidence, test a hypothesis and verify the correction. Learn not to infer compromise from an outage alone. | Investigate a suspicious message. |
| Suspicious Email | Choose inspections, combine independent observations, classify and choose a safe action. A domain mismatch is a signal, not proof by itself. | Correlate a similar message with account activity in First Signal. |
| First Signal | Connect message, activity and authentication logs; sequence events, distinguish containment from evidence preservation. | Inspect an independent SOC session alert with less guidance. |
| First SOC | Triage, inspect and collect decisive sources, compare chronology, then use a Board when correlation is needed. | Explain a hypothesis, proportional response and documentation. |
| Locker / Board / Decision | Locker preserves sources and notes; Board records supported relationships. Incorrect conclusions return to relevant evidence. | Return to the alert and record the response; review saved progress after success. |
| Attack Surface | Map assets/services, distinguish intended exposure from policy/configuration mismatch, prioritise and validate. | Assess resource permissions. |
| Access Control | Compare identity, resource ownership and the server's decision; state bounded impact and verify the correction. | Assess session trust through login/logout states. |
| Authentication & Session | Compare previous/current/no-session requests to the same resource, propose remediation and retest all allowed/denied cases. | Offensive Foundations Completed: foundational skills only, no professional/certification claim. |

Beginner coherence is supported by a successful functional acceptance journey from the visible Dashboard action. This does not establish a measured 30-second comprehension time or enjoyment for a real novice.

Defensive coherence improves from signal inspection to multi-source correlation and then independently justified response. Advanced tools appear at their point of use. The progression retains the existing story and grading rather than replacing activities.

Offensive coherence is strong at the level of distinct reasoning tasks: inventory/exposure, per-resource permission, then session lifecycle. The three experiences share a controlled UI pattern but assess different evidence and conclusions. Existing knowledge prerequisites and Session's requirement to complete the first two assessments remain unchanged.

## Scope and stability retained

- 220 lesson IDs retained; classification stays 135 Cyber Core / 60 Cyber Supporting / 25 Out of Scope.
- The 25 additional/archive lessons remain addressable and prior achievements remain recorded. They are not selected as the main cyber continuation.
- 14 original labs and 8 interactive labs retained; no fourth Offensive assessment or new content.
- Existing prerequisite and unlock definitions are retained. SOC activities without a defined prerequisite are not given invented gates; guided recommendations and knowledge at need provide context.
- No changes to Authentication, reward architecture, XP, Skill XP, Mastery, Adaptive Learning, Career, Rank, NexaCorp IDs, Mission/Lab/SOC/Investigation storage, migrations, hosting audience or schema.
- Existing completed assessments retain access without rechecking newly added requirements. Replay uses existing unique reward keys.
- The full library, legacy activity views and saved career history remain available. They were not transformed or rewritten; the main beginner path continues to be Mission-First.
- No full visual redesign, navigation rebuild, economy change or broad performance work.

## Checks and test evidence

Final build and type check: PASS.
Regression: 28 of 28 suites PASS after the last product changes.
`git diff --check`: PASS.

Expanded `mission-first-core.test.mjs` follows the actual Dashboard and visible core CTAs through Network → Email → First Signal → SOC → Locker/Board → Decision. It checks progressive visibility, the required SOC check, wrong/recheck/correct, contextual reference links, source mirroring/deduplication, read-only completed views, restart persistence, isolated accounts and idempotent rewards.

New `final-product-qa.test.mjs` verifies Version 51 contracts, zero/existing/returning/exhausted Dashboard states, preserved legacy and archived progress, started practice status in Search/catalog, real locked requirements and reachable URLs, immediate unlocking from current saved progress, the 22-lab counter, Offensive discovery and guest return context, full-reference and optional-quiz return, wrong SOC recovery and Dashboard recommendation, local persistence and isolation.

Existing suites continue to cover the complete three-assessment Offensive journey, wrong hypotheses, bounded impact, remediation and retest, Replay and concurrent completion without duplicate XP or Skill XP; lessons, missions, campaigns, investigations, dynamic incidents, skills, mastery, career, ranks, navigation and persistence.

## Not verified and remaining manual review

- Real Production OAuth, sign-out/sign-in callback and a real historical Production account session were not exercised. Local returning-user identity/persistence tests do not substitute for them.
- Actual mobile rendering, touch interaction, iPhone hardware, Safari, keyboard focus, screen reader and screenshots were not tested. Existing RTL markup/mobile rules were checked by regression, not visually certified.
- New-user comprehension, cognitive load, enjoyment and difficulty need a real learner walkthrough; no fabricated rating or timing is claimed.
- The other library lessons were not all rewritten or individually assessed for teaching quality. This pass fixes the references needed in the core journeys and preserves the broader library.
- No further stage has begun. Final UI/Mobile/Performance requires a separate user instruction.
