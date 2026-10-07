# CyberLab · Curriculum Audit v1

## Scope and baseline

The site has 17 tracks and 220 lesson IDs. This iteration audits the current catalog but improves four tracks only: IT Fundamentals (12 lessons), Networking (16, including `net-1`–`net-4`), Cybersecurity Fundamentals (16, including `sec-1`–`sec-4`), and SOC & Blue Team (12). The remaining 13 tracks are unchanged. No lesson ID was removed or renamed.

The 12 lessons in each newer track were generated from one concept and one example per row, grouped into three modules of four. Their assessment usually asked for the definition, the example's term, and a true/false, ordering or terminology question. This gave coverage without enough transfer from one context to another. Several short lessons had the same rhythm and their third question could be solved by recognizing the English term. The legacy networking and security lessons were presented under a separate “original introduction” module despite overlapping these newer levels. The lab links favored legacy IDs and did not consistently lead from a concept to practical application.

## Structure implemented

Each focused track now presents three ordered levels/modules. A module names its objective, reason, prerequisite review, practice, assessment and lab. Every lesson in these four tracks has an explicit objective, why it matters, prerequisites, skills, subskills, lab/mission/boss references, career stage reference and estimated time. Prerequisites are advisory, so an existing account can still open completed or bookmarked lessons. Existing legacy IDs are placed inside the relevant modules. Twelve high-value lessons have a rewritten explanation, concrete workplace artifact, guided decision with specific corrective feedback, takeaway and follow-up route. Nine of these have applied three-part assessments (scenario, ordering or multi-select, and short answer) graded on the server with topic-specific feedback. Other lessons retain their existing questions and completion rules. The lesson XP and Skill XP systems are untouched.

| Track | Level 1 | Level 2 | Level 3 | In-depth rewritten IDs | Practice |
|---|---|---|---|---|---|
| IT Fundamentals | الجهاز ونظامه | البيانات والتطبيقات | تشخيص المشكلات | `it-2`, `it-6`, `it-12` | Terminal, Network Lab; No Internet, The Broken Office |
| Networking | أجهزة الشبكة | العنونة والخدمات | التصميم والتوجيه | `network-5`, `network-8`, `network-9` | Network and Terminal Labs; No Internet, DNS Problem, The Broken Office |
| Cybersecurity Fundamentals | مبادئ الحماية | الهوية والتهديدات | الدفاع والتحقق | `security-1`, `security-8`, `security-11` | Email and Log Labs; Suspicious Email, Failed Login Attempts, The Phishing Incident |
| SOC & Blue Team | المراقبة والسجلات | الفرز والتحقيق | التحسين المستمر | `soc-2`, `soc-7`, `soc-10` | Log Lab, SOC Console; Failed Login Attempts, The Phishing Incident, Midnight Breach |

The new case examples use safe fictional addresses and simulated logs. The guided exercise has no reward; completion remains determined by the existing quiz endpoint. Lesson IDs and stored completion rows remain authoritative. Reordering legacy lessons affects the suggested next lesson but never clears completion or repeats XP. Mastery receives the relevant existing subskill signals from the rewritten applied lessons without rewriting XP accounting.

## Gap inventory and deferred work

| Track | Present but still short or shallow | Topics still missing or underdeveloped |
|---|---|---|
| IT Fundamentals | Software, OS, extensions, updates, task manager, permissions | A more complete beginning-to-end worked example for processes and user permissions; internet basics and how computers communicate need a novice-friendly hands-on scenario. |
| Networking | LAN/WAN, MAC/switching, subnet, gateway, DNS, DHCP, OSI, VLAN, VPN, legacy TCP/UDP/ports, firewall | Routing decisions, NAT, firewall rule reasoning, TCP vs UDP and systematic multi-hop troubleshooting need deeper supported practice; switching/routing can be clearer than a single definition each. |
| Cybersecurity Fundamentals | CIA, risk, authentication, MFA, social engineering, least privilege, legacy phishing/hashing | Malware, password storage, encryption versus hashing, updates and practical access control need integrated worked cases rather than isolated definitions. |
| SOC & Blue Team | SOC, log source/normalization, SIEM, triage, timeline, indicator, hypothesis, detection rule | Endpoint and network event analysis, incident versus alert, escalation, containment and case documentation need dedicated guided cases tied to SOC Console. |

A topic listed above is **not** marked as mastered because its name appears in a lesson or another track. Expansion should proceed through authored examples and assessment validation rather than bulk generation. There is no placeholder page or duplicate Mission/Lab in this release.

## Verification targets

- Reference integrity across all lesson prerequisites and related lab/mission/boss IDs.
- Applied answer correctness, incorrect feedback and malformed submissions.
- Existing ID count, user isolation, idempotent quiz XP, progress after D1 Worker restart, two tracks, old completed lessons, and the existing Missions/Boss/Campaign/SOC/Lab/Adaptive/Career/Rank suite.
- Real browser check of track → level → lesson → guided exercise → quiz and links, plus responsive viewport when available.
