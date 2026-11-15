# Stage 6 — UGREEN Toolkit 0.7.3 Compatibility Audit

Audit of the latest official UGREEN Skill Developer Toolkit against the Stage 5
BuildVault release candidate. Performed 11 November 2026 in OpenCode.

## 1. Archive located and identity

Two copies were found and both are byte-identical:

| Copy | Path | Size | sha256 | Date |
|---|---|---|---|---|
| A | `C:\Users\User\Downloads\uliya-skill-kit-0.7.3-en.zip` | 37,575 B | `cf557e5a022e4297892f39768132855154232efdedeb726b2845450ccd70e1b3` | 2026-11-02 |
| B | `C:\Users\User\Downloads\uliya-skill-kit-0.7.3-en (1).zip` | 37,575 B | `cf557e5a022e4297892f39768132855154232efdedeb726b2845450ccd70e1b3` | 2026-11-10 |

Copied A was extracted to `toolkit-0.7.3/uliya-skill-kit/`. The existing workspace
toolkit at `toolkit/` was **not** written to.

**This resolves a Stage 5 open item.** Stage 5 recorded the toolkit's release number as
NOT VERIFIED. The archive published on the official Starter Kit page is
`uliya-skill-kit-0.7.3-en.zip`, and the workspace toolkit is byte-identical to it — so
the workspace toolkit is confirmed to be the official 0.7.3 release.

## 2. File-by-file comparison

All 26 files, all 26 identical. No additions, removals or modifications.

| Comparison | Result |
|---|---|
| Files in old toolkit | 26 |
| Files in new toolkit | 26 |
| Identical | **26 / 26** |
| Changed | **0** |
| Only in old | 0 |
| Only in new | 0 |

Spot-checked by hash (old vs new, first 16 hex):

| File | Result |
|---|---|
| `SKILL.md` | SAME `7a69238f3737e568` |
| `scripts/check-skill.mjs` | SAME `6a9e8ad164862ab7` |
| `scripts/check-lib.mjs` | SAME `a4020044c1138f19` |
| `data/capability-catalog.json` | SAME `c927fd8e233696cd` |
| `schemas/capability-catalog.schema.json` | SAME (deepEqual, 8,463 B) |
| `schemas/check-result.schema.json` | SAME (deepEqual, 2,923 B) |
| `docs/skill-development-standard.md` | SAME |
| `references/skill-format.md` | SAME |

## 3. Capability catalog comparison

| Property | Old | New | Same |
|---|---|---|---|
| `catalogVersion` | 2.0.0 | 2.0.0 | yes |
| `generatedAt` | 2026-09-01 | 2026-09-01 | yes |
| CLI count | 9 | 9 | yes |
| Total actions | 78 | 78 | yes |
| Agent-mapping differences | 0 | 0 | yes |
| Action-name differences | 0 | 0 | yes |

All nine CLI-to-expert mappings, re-audited against the new catalog:

| CLI | Expert | Actions |
|---|---|---|
| `ug-music` | `media-agent` | 2 |
| `ug-video` | `media-agent` | 4 |
| `ug-surveillance` | `security-monitor-agent` | 8 |
| `ug-filesystem` | `file-agent` | 17 |
| `ug-filemgr` | `file-agent` | 13 |
| `file-workflow` | `file-agent` | 5 |
| `ug-document` | `document-agent` | 7 |
| `ug-knowledge` | `knowledge-agent` | 4 |
| `ug-photo` | `photo-agent` | 18 |
| **Total** | **6 experts** | **78** |

BuildVault cites six of these nine CLIs (`ug-music` and `ug-surveillance` are not used,
consistent with the Stage 1 audit).

## 4. Official checker run against the Stage 5 Skill

Run from the **new** toolkit against the **unmodified** Stage 5 Skill:

```
node toolkit-0.7.3/uliya-skill-kit/scripts/check-skill.mjs buildvault-skill/buildvault-project-intelligence
```

```
{
  "checkFormatVersion": "2.0.0",
  "status": "static-pass",
  "target": { "skillName": "buildvault-project-intelligence" },
  "catalog": { "checkedVersion": "2.0.0" },
  "files": [ { "path": "SKILL.md", "sha256": "4a27456f7ee381457b53876a86c8e6709890aeca8e36c1794f63a13740f93496" } ],
  "summary": { "errors": 0, "warnings": 0, "info": 0 },
  "diagnostics": []
}
```

Exit code 0. The Stage 5 Skill is structurally compatible with toolkit 0.7.3.

## 5. Structural requirements confirmed from `check-lib.mjs` (identical in both copies)

The checker enforces, and the Stage 5 Skill satisfies, all of the following:

| Requirement | Enforced by | Stage 5 Skill |
|---|---|---|
| Root contains only `SKILL.md` and `references/` | `readTarget` | **PASS** |
| Frontmatter has only `name` and `description`, single-line, non-empty | `parseFrontmatter` | **PASS** |
| `name` matches `^[a-z0-9]+(?:-[a-z0-9-]+)*$`, 2–64 chars | `checkSkillMarkdown` | **PASS** |
| Directory name equals frontmatter `name` | `checkSkill` | **PASS** |
| `description` ≤ 1,024 chars | `checkSkillMarkdown` | **PASS** (477) |
| Description contains a trigger phrase | `descriptionTriggerPattern` | **PASS** |
| Required headings: `Goal`, `Required input`, `Workflow`/`Orchestration`, `Completion and failure` | `checkSkillMarkdown` | **PASS** |
| Heading of capability evidence: `Generation-time capability evidence` | `checkCapabilityEvidence` | **PASS** |
| Evidence lines exactly `- \`<cli>\` → \`<agent>\`` | `checkCapabilityEvidence` | **PASS** (6 lines) |
| Each delegate target is a registered expert | `checkDelegates` | **PASS** (4 targets) |
| Every delegate target has CLI evidence | `checkCapabilityEvidence` | **PASS** |
| `delegate --target X --instruction '...'`, exactly one each, shell single quotes, no backticks, no `$(`, no `\|\|`, no `&&`, no other flags | `checkDelegates` | **PASS** (7 commands) |
| No unresolved `<...>` placeholder or cross-step pronoun in an instruction | `unresolvedDynamicValuePattern` | **PASS** |
| No hardcoded user home path | `hardcodedHomePattern` | **PASS** |
| All five delegation statuses present | `requiredStatusTokens` | **PASS** |
| Empty-result handling language present | `emptyResultHandlingPattern` | **PASS** |
| No direct `cli.invoke` outside negation | `requiresDirectCliInvoke` | **PASS** (zero occurrences) |
| No internal capability or profile claims | `scanSecurity` | **PASS** |
| No approval-bypass wording | `bypassPattern` | **PASS** |
| No scripts, credentials, remote download, direct file/HTTP/NAS access | `scanSecurity` | **PASS** |
| Package ≤ 100 files, ≤ 10 MB, ≤ 1 MB/file | `checkPackageLimits` | **PASS** |

Two requirements are of note for Stage 7 because they constrain how the Skill may grow:

1. **Every delegate target must have at least one CLI in the evidence section.** If a new
   feature delegates to an expert, a CLI owned by that expert must already appear, or a
   new CLI line must be added — and each CLI may appear only once.
2. **Instruction text must not contain `<...>` placeholders, backticks, apostrophes, or
   cross-step pronouns** such as "that directory from before". All context must be
   restated in each instruction.

## 6. OpenCode compatibility — what can and cannot be validated

OpenCode is a development environment, not a UGREEN runtime. It is **not** listed among
the assistants the Starter Kit names (WorkBuddy, Claude, Codex), and this audit makes no
claim that it is.

**What OpenCode can validate:**
- Static structure, frontmatter, headings, evidence-line formatting and delegate syntax,
  via the official checker.
- Fixture integrity: that synthetic files really contain the conditions each test needs.
- Local deterministic logic: inventory building, evidence ledgers, conflict detection,
  timeline construction, manifest assembly, recommendation ranking — implemented and
  executed in the Stage 7 harness.
- ZIP packaging, size and content rules.

**What OpenCode cannot validate:**
- That any UGREEN expert agent executes, or returns, anything. No delegation has run.
- That `cli.invoke` works, or that any Action parameter is accepted by a real CLI.
- Any file write, move, creation, tag or save on a NAS.
- `ug-photo` vision, `ug-knowledge` transcription, or real `ug-document` extraction.
- Upload, installation, device compatibility or runtime behaviour.

**Explicit non-claims:** this audit does not claim that OpenCode is officially supported,
that OpenCode executed a UGREEN expert, that a local test proves NAS execution, or that
any mock response proves delegation. The Stage 7 mock responses are labelled simulations
and are never presented as expert results.

## 7. Compatibility verdict

**No fundamental incompatibility.** The 0.7.3 toolkit is byte-identical to the workspace
toolkit, the catalog is unchanged, and the Stage 5 Skill passes the 0.7.3 checker with
zero errors and warnings. Stage 7 development may proceed.

## 8. Limitations and recommended corrections

| # | Limitation | Impact | Recommendation |
|---|---|---|---|
| 1 | The published toolkit is a design-time archive only; it contains no NAS runtime | No compatibility statement can extend to device behaviour | Keep all runtime claims out of the Skill and the proposal; re-run the checker on the device |
| 2 | Byte-identical archives mean 0.7.3 introduces no new capability | Feature planning is bounded by the existing catalog (78 actions) | Treat every Stage 7 feature as either supported by an existing action or BuildVault reasoning |
| 3 | The checker is static; it validates form, not semantics | A Skill can pass and still describe unsupported behaviour | Keep the audit and fixture tests as the semantic check |
| 4 | Starter Kit illustrates a root `README.md`; the checker rejects any root file but `SKILL.md` and `references/` | Following the illustration breaks the checker | Follow the checker; `README.md` is not permitted at the Skill root |
| 5 | Tool version (0.7.3) and catalog version (2.0.0) are distinct identifiers | Easy to misreport | Report both explicitly in the submission |
