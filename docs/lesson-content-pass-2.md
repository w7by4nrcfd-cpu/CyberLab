# Lesson clarity pass 2

2026-10-07. The user reported that the new site experience works on their device and requested continuing development in the conversation. This pass covers 13 basic lessons in the existing three atlas directions; it is not a rewrite of all 220 lessons.

## Changes

- Networking: LAN, MAC, switch forwarding and /24 masks (`network-1`, `network-3`, `network-4`, `network-6`). Remove repeated definitions, provide concrete inputs/results and explain what each comparison establishes.
- Linux: current directory, listing, changing directory, reading, permissions and processes (`linux-3` through `linux-6`, `linux-8`, `linux-9`). Give commands and illustrative output, then a reflection task. Explain relative paths, hidden names, timestamps, the effect of 600 on another account and why process presence does not prove service health.
- SOC: operations, alerts and timeline (`soc-1`, `soc-5`, `soc-8`). Separate observation from conclusion; illustrate missing device evidence and correlation by session after converting time zones.

Only explanation fields and specific lesson objectives change. IDs, order, timing, questions, assessment answers, interaction grading, practice contracts, unlocks, XP, APIs and D1 remain unchanged. The examples are teaching artifacts, not additional executable site labs. The existing copy button can copy them; command availability in the constrained training terminal remains defined by that lab.

## Primary source review

Original GNU manuals published as part of coreutils and rendered by man7: [pwd](https://man7.org/linux/man-pages/man1/pwd.1.html), [ls](https://man7.org/linux/man-pages/man1/ls.1.html), [cat](https://man7.org/linux/man-pages/man1/cat.1.html), [chmod](https://man7.org/linux/man-pages/man1/chmod.1.html). [POSIX cd](https://man7.org/linux/man-pages/man1/cd.1p.html) and the [procps ps manual](https://man7.org/linux/man-pages/man1/ps.1.html) define command behavior. Direct GNU/Open Group page fetches were unavailable; the published original manual pages were read instead.

Networking: [Cisco MAC configuration guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/cdp-lldp-mac-udld/cdp-lldp-mac-udld-configuration-guide/configure-mac.pdf), [RFC 950](https://www.rfc-editor.org/rfc/rfc950). SOC: [Microsoft incidents and alerts](https://learn.microsoft.com/en-gb/defender-xdr/incidents-overview), [Sentinel investigation and timeline](https://learn.microsoft.com/en-us/azure/sentinel/investigate-incidents). Fictional events, accounts, numbers and reflection cases are original teaching examples, not copied product data.

## Validation and limitations

`lesson-examples.test.mjs` checks pwd/cd/ls/cat/chmod in temporary fixtures, subnet arithmetic and the learner-visible timeline. Running ps is blocked by this managed runtime's process-table access (`fatal library error, lookup self`); the original procps manual confirms the example syntax. This is recorded as blocked, not an executed pass. `training-simplified.test.mjs` compares the last published curriculum and clarity module and checks that exactly the selected 13 explanations changed while all non-explanation fields remain identical. Existing worker/D1 and UI navigation regressions guard saved progress and integration. These tests do not measure learner comprehension or certify all curriculum content. The next content pass should use learner errors and task completion to select lessons rather than adding volume.
