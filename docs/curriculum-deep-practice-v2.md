# CyberLab · Curriculum Deep Practice v2

## Scope

Eleven existing lesson IDs cover the ten audit topics. The catalog remains 220 lessons; there are no new pages, systems, migrations or reward rules. Each improved lesson now has an objective and rationale, a workplace example, a guided evidence decision with immediate corrective feedback, a different independent case in the three-part quiz, and links into existing Labs, Missions, Boss Missions or SOC investigations. Quiz keys and specific explanations remain server-side. A correct independent decision plus at least one of the supporting-evidence and short-response questions are needed to pass; a perfect score requires all three. Existing saved completions and first-completion XP rules remain intact.

| Topic | Lesson ID | New application | Existing follow-up |
|---|---|---|---|
| Processes | `it-10` | Compare a signed, approved CPU-heavy updater with a low-CPU unsigned process spawned by mail; inspect parent, path and signature. | Terminal Lab `ps`; SOC-003/004 |
| Beginner permissions | `it-11` | Grant a time-bounded read permission; reject unrelated Admin and file access in an application request. | Terminal Lab `whoami`/`chmod`; SOC-009 for context |
| TCP/UDP | `net-3` | Choose ordered retransmission for a file and a low-latency strategy for live audio; explain packet loss. | Network Lab and No Internet Mission (broader diagnostics) |
| Routing | `network-7` | Distinguish missing router path from a wrong default gateway on a different host. | Network Lab; No Internet; The Broken Office |
| NAT/PAT | `network-10` | Trace source IP/port translation and return mapping; diagnose a missing mapping for a second host, preserving OSI explanation. | Network Lab (gateway context); The Broken Office |
| Malware | `security-9` | Correlate process, unsigned file, login and outbound activity; contrast a signed authorized update and preserve defense-in-depth. | Log Lab; SOC-003/004; Midnight Breach |
| Encryption/Hashing | `sec-4` | Separate confidential file delivery, trusted digest comparison, salted password verification and backup recovery. | SOC-004 file hash; Midnight Breach |
| Endpoint events | `soc-3` | Compare signed PowerShell maintenance with an unsigned child process following an unusual session. | Log Lab; SOC-003/004/009 |
| Network events | `soc-4` | Correlate NetFlow with endpoint and change records; reject size-only exfiltration claims, retain SIEM context. | Log Lab; SOC-005/008 |
| Incident containment | `response-6` | Choose fast coordinated isolation for active corroborated activity and investigation before isolating authorized work. | Log Lab; SOC-003/004/005; Midnight Breach |
| Case documentation | `soc-12` | Write an evidence-referenced note, distinguish observation and inference, record the owner and next action, then extract a lesson learned. | Log Lab; SOC-008/005; Midnight Breach |

## Persistence and backward compatibility

The eleven original IDs and all other IDs are unchanged. The lesson completion endpoint, 100 XP first-completion reward, Skill XP reward table, database schema, level rules and saved progress format are unchanged. Existing completions are still recognized and replays do not grant XP. Lab `relatedLessons` metadata points back to several expanded lessons but changes no lab scoring or reward. Existing account records are not rewritten.

## Verification and honest limits

`tests/deep-practice.test.mjs` checks all eleven lessons, the new guided/independent structure, valid link IDs, correct and wrong decisions, aliases, malformed evidence, server feedback and catalog stability. The existing D1 Worker persistence and regression tests cover first completion, refresh/restart and duplicate XP along with the other platform systems. Typecheck and production build are separate checks.

The reusable Network Lab currently models IP, gateway, DHCP, DNS and host isolation. It does **not** simulate NAT mappings or ask the user to select a TCP/UDP transport inside the lab. Those two topics are independently assessed inside their lessons and contextualized in the network exercises and missions, but a dedicated stateful lab for them remains a genuine practice gap. The Log Lab's final objective is authentication centered even though its viewer includes endpoint and network rows; the SOC cases provide the deeper investigation and case-note practice. These limitations should not be described as completed standalone labs.
