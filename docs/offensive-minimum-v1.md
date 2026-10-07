# Offensive Minimum Track v1

Baseline: Version 50, commit f2b4b65d4d63207efd3295394cbc0e517f96ebe4.

## Scope and reuse

Exactly two new assessments join the unchanged Access Control scenario:

| Order | Lab ID | Focus | Prerequisites |
| --- | --- | --- | --- |
| 1 | v2-attack-surface | Scope, three-asset map, service vs exposure, policy/configuration correlation | Existing security-6 reading/quiz completion and v2-http completion |
| 2 | v2-access-control | Object authorization, existing Version 50 scenario | Unchanged security-6 and v2-http prerequisites; no new prerequisite imposed on existing users |
| 3 | v2-auth-session | One problem: accepting a previous session after simulated logout | Completed v2-attack-surface and v2-access-control |

The first two are a recommended instructional order, not a retroactive access restriction. All completed labs retain the existing prerequisite bypass. The last lab requires both earlier completions. The track is available at `/practice/offensive`, linked from Labs. Existing Access Control only gains an optional `?track=offensive` navigation context. Its default flow, ID, data, grader, prerequisites and reward amount remain unchanged.

No curriculum/lesson IDs, scope classifications, existing company entities, mission/SOC/investigation data or learning journeys are replaced. No career, mastery, adaptive learning, rank, skill or reward formulas change. No migration or schema changes.

## Models and persistence

`offensive-minimum.ts` defines only these two scenarios: allowed entities, fixed options, steps and reference mappings. `offensive-minimum-actions.ts` is a bounded adapter dispatched by the existing interactive-lab action handler. It does not scan, execute a command, fetch a URL, handle credentials, or generate payloads.

The optional `session.minimum` field stores authorization, stage, inspected items, map classifications, priority, simulated login phase, hypothesis, deduplicated observations, bounded finding/impact/evidence decision, chosen patch and deduplicated retests. All state uses the existing per-user/per-lab `interactive_lab_progress.session_json`. No new ledger or engine.

Two company training assets are appended: `surface-training` and `session-training`. They have no real device IDs, service IDs, addresses or credentials. TRAIN-PORTAL, TRAIN-METRICS and TRAIN-ADMIN are predefined fictional identifiers inside the surface scenario, not newly assigned company production devices. Session identity references the existing Sara employee/account; no actual account is modified. The access-training asset remains unchanged.

## Assessment design

Surface: inspect HTTPS 443 portal, HTTP 8080 metrics and internal-only SSH 22; classify limited initial evidence, prioritize metrics, compare inventory policy plus observed allow-zone setting with external/internal simulated responses, then confirm only a configuration exposure. Open port or banner does not prove a software vulnerability. Impact is limited to fake operational metadata. Restrict metrics to management zone, then retest external 403, internal 200 and intended portal 200. Closing all services fails because approved functionality stops.

Session: simulated Sara login creates alias A; logout removes it from the simulated browser and an anonymous request is rejected; a new login creates B. Compare saved A, current B and anonymous requests to the same own-account resource. Before remediation A and B return 200, anonymous 401. Wrong browser/authorization hypotheses return observations that contradict them, without announcing a complete solution. Prove bounded continued own-profile access, revoke A on the simulated server, then retest A 401, B 200 and anonymous 401. No fixation, password, MFA, cross-account or second vulnerability is introduced.

Knowledge on demand uses existing references: net-3, network-security-1, web-7, security-5, web-9, web-10, web-security-6; scope reference tools-1 is also mapped to surface. Exact same-origin return allowlists restore the existing persisted assessment stage without requiring lesson completion. Access Control retains its existing reference mappings and optional track return context.

## Rewards and completion

Each new lab uses the existing 75 XP first-completion rule and standard 25+10 Skill XP definition. Surface: networking 25/cybersecurity 10. Session: cybersecurity 25/logs 10. No new reward algorithm. Existing unique progress and skill-award keys prevent duplicate XP/Skill XP on replay or simultaneous submit. Track completion is derived from the three existing completed lab rows, grants nothing additional, and displays Offensive Foundations Completed with foundational skills and no certification/job readiness claim.

## Verification

- Build succeeded.
- Type Check succeeded.
- 27/27 regression suites succeeded, including the existing Access Control suite and new offensive-minimum suite.
- Compiled UI hook harness connected to a real local Worker and isolated D1 database tested the three-assessment sequence, one primary action per stage, locked API/search/direct routes, old Access Control access, existing/completed users, wrong classifications/priorities/hypotheses/impact/fixes, evidence deduplication, full-reference return links, state reload, persistent Worker restart, account isolation, fixes/retests and derived completion.
- First and replay concurrent submit tests confirmed only 225 XP and 105 Skill XP total across the three distinct labs, with unchanged reward rows after replay. Existing non-assessment records remained unchanged.
- RTL elements, LTR technical traces and responsive CSS rules were checked. This is not a viewport/rendered browser/mobile usability test.
- No Production account activity, real OAuth sign-out/sign-in, actual iPhone/Safari or real browser visual testing was performed. Those remain manual checks. OAuth is not changed by this phase.

Stop after this minimum track. No fourth assessment or Final Learning & Product QA is started.
