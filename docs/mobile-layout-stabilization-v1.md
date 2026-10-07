# Mobile Visual QA & Layout Stabilization v1

Baseline: published Version 54, source `a48132bf517e72cfbf9f2bc43c26398fd8e55a67`.
Disposition: propose Version 55; no deployment performed. Beta Gate remains paused.

## Proven issues and fixes

1. Mobile Header/Search/Login overlap. The mobile action grid reserved four
   columns even when notification/XP utility items were hidden. Sign-in occupied
   a 44px column and its Arabic label extended into search. Reproduced in the
   provided iPhone screenshot and the local Chromium preview at 375px.
   The mobile grid now uses two columns: flexible search and intrinsic-width
   sign-in. Utility items are hidden consistently across the mobile breakpoint.
   Breadcrumbs get a shrinkable container, stable home link and 44px link targets;
   search/sign-in have 48px height, search submit has a 44px target, and input
   text stays 16px. Desktop header rules and navigation destinations are retained.
2. Learning Map primary CTA was effectively unreadable: `.guided-map a` overrode
   its dark foreground with `rgb(181,234,201)` on `rgb(162,244,199)`. The generic
   link rule now excludes `.primary-button`. Actual computed foreground after
   correction: `rgb(20,51,39)`; the same Arabic label is visibly readable.

Only application file changed: `app/globals.css`. No JS/TS implementation,
auth/ownership/reward/completion code, IDs, unlock rules or D1 changes.

## Browser evidence and scope

Real cloud Chromium rendered the local managed preview in same-origin frames
whose CSS viewport widths were 375, 390, 402 and 430px. This is responsive browser
verification, not iOS/Safari emulation. Chromium's classic vertical scrollbar
reduced layout client width by 15px. Screenshots were inspected at both rows of
the viewport matrix; loading/partially painted captures were not accepted as
final page evidence. No arbitrary authentication/session data was injected.

18 entry routes were measured at each of four widths (72 layout records).
Measurements checked document horizontal overflow and search/sign-in rectangle
intersection; screenshots checked the visible header, initial content and RTL.
All four widths had no detected horizontal document overflow or header overlap
in the measured states. This does not certify every scrolled or authenticated
state of these routes.

| Routes | State actually available |
| --- | --- |
| `/`, `/search?q=NAT`, `/learn/security-5` | Guest Dashboard, real search/filter results, lesson/breadcrumbs |
| `/experience/nexacorp-first`, `/experience/nexacorp-email` | Guest Mission-First briefs; focused layout |
| `/campaigns/first-signal`, `/soc/alerts/SOC-002?view=guided` | Focused sign-in-required state |
| `/soc`, `/investigations/soc-SOC-002` | Guest overview / sign-in-required state |
| `/labs/v2/v2-attack-surface`, `/labs/v2/v2-access-control`, `/labs/v2/v2-auth-session` | Guest prerequisite/sign-in state |
| `/roadmap`, `/learn`, `/progress` | Guest learning map/library/zero-progress display |
| `/account`, `/profile`, `/operations/nexacorp` | Guest account/profile prompt; NexaCorp overview |

Additional actual UI checks:

- 375px mobile menu open/close; sidebar fits the viewport; close target 44px.
- Network case brief to Explore; IPv4/device/gateway values legible at 375px.
- Email brief to Explore to headers; SPF/Return-Path/addresses readable at 375px
  and 430px without document overflow.
- Email Knowledge Card to full existing lesson and its visible Return to Case
  link: returned to `step=explore&field=headers`.
- Header search text input, Enter submission and actual DNS results at 375px.
- Desktop Dashboard at 1280px: full sidebar/header rendered with utilities intact.

## Final checks

- Build: PASS (`npm run build`).
- Type Check: PASS (`npx tsc --noEmit`).
- Regression: PASS, 30/30 existing suites, including security, persistence,
  investigation board, dynamic incidents, Mission-First, offensive assessments,
  UI, navigation and Worker tests. These are local automated tests, not proof of
  Production OAuth or physical touch behavior.
- `git diff --check`: PASS.
- Temporary public viewport harnesses removed, including stale build-output
  copies; they are not part of the candidate assets.
- Compared to Version 54: protected application/data/engine files unchanged.
  The preceding Beta Gate audit document remains in source; its work is paused.

## Not verified

- Physical iPhone/Safari, Safari address-bar/safe-area behavior, touch precision,
  iOS keyboard/zoom and visual viewport resizing.
- Actual Production OAuth or an authenticated Production account. No Production
  progress was written or reset; no authenticated-account integrity claim is
  inferred from the guest browser checks.
- Authenticated Evidence Locker/Board, final investigation decisions, detailed
  SOC evidence, unlocked offensive forms and populated profile state. Their
  guest entry/guard states were inspected; internal data-heavy screens remain
  a manual visual verification requirement.

## Short iPhone/Safari follow-up (under five minutes)

1. Dashboard: confirm search/login/profile/breadcrumb never overlap; open and
   close menu, focus search, type, dismiss keyboard and submit.
2. Network/email: scroll the case, check IP/email/header direction, open a
   Knowledge Lesson and use Return to Case.
3. Existing SOC investigation: open collected evidence and Board, focus a note
   without saving, dismiss keyboard; check bottom controls are reachable.
4. Open an existing offensive assessment and inspect technical/form controls;
   refresh without submitting completion.
5. Learning Map/Profile: confirm CTA label and header remain readable; repeat
   portrait/landscape and check no horizontal page scrolling.

Do not resume Beta Gate or Commercial Readiness automatically.
