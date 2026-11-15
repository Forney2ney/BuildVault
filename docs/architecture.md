# BuildVault Architecture

**BUILDVAULT — Engineering Project Intelligence**
*"Your projects, understood. Your knowledge preserved. Your next steps planned."*

Scope: understand, organize, document and help manage the complete lifecycle of engineering projects — CAD models, STL files, drawings, research, reports, code, firmware, electronics, test results, photographs, videos, components, materials, specifications and costs.

This document supersedes the narrower "project timeline tool" framing. It is an architecture and feasibility document only. **No Skill is implemented here.** Every capability claim traces to `docs/capability-audit.md` and `toolkit/data/capability-catalog.json` (v2.0.0, 2026-09-01). Nothing here was executed against a NAS.

---

## 1. Design principle: the platform / reasoning split

The single most important architectural decision is the boundary between what the UGREEN platform does and what BuildVault does.

| Layer | Who | What it may do | What it must never do |
|---|---|---|---|
| **Acquisition** | Platform, via delegated experts | Discover files, read metadata, extract document facts with evidence, OCR/transcribe media, collect evidence, dedupe | Invent data; write anything without approval |
| **Verification** | Platform, via delegated experts | Return real paths, `fileId`, coverage, failures, warnings, `verified` flags | Claim completion before `completed` |
| **Interpretation** | BuildVault (parent Skill) | Reconstruct timelines, classify milestones, detect contradictions, score scope creep, recommend actions | Present reasoning as platform output; fill gaps with plausible-sounding facts |
| **Persistence** | Platform, after explicit user approval | Write manifest and reports (`ug-knowledge save-text`, `ug-filesystem echo`), create directories, move files | Write silently, overwrite, or reorganize without approval |

Every feature below is tagged **PLATFORM** (a catalog Action performs the work), **REASONING** (BuildVault derives it from verified results), or **HYBRID** (platform supplies inputs, BuildVault supplies the judgment, platform persists).

---

## 2. The shared foundation

All five capability areas draw on two shared models. They are the contract between the platform layer and the reasoning layer, so they are defined before any feature.

### 2.1 Evidence model (EV)

The evidence model exists because `docs/capability-audit.md` section 4 shows the platform has **no structured evidence store**: evidence arrives inside responses from `ug-document qa`/`extract` and `ug-knowledge collect-evidence`, and is lost unless BuildVault carries it forward.

Every non-trivial claim carries an evidence record:

| Field | Meaning | Rule |
|---|---|---|
| `claim_id` | Stable identifier for the claim | Assigned by BuildVault |
| `statement` | The claim in the user's language | Never paraphrased into a stronger claim |
| `source_ref` | Real file path (and `fileId` when returned) | Must be a value actually returned by an expert |
| `origin` | Which capability produced it, e.g. `ug-document extract` | Records provenance of the evidence, not just the fact |
| `coverage` | Whether extraction covered the full document or a capped window | Copied from the platform response, never estimated |
| `basis` | `verified` \| `inferred` \| `user-supplied` | `verified` only when the platform actually returned it |
| `conflicts_with` | Other `claim_id`s that disagree | Set by BuildVault when two verified claims contradict |
| `status` | `confirmed` \| `partial` \| `missing` \| `conflicting` | `missing` is an explicit, honest state |

Hard rules: a claim with no `source_ref` is marked `user-supplied` or discarded; a statement of `missing` never implies the underlying work was never done; conflicting evidence is surfaced rather than silently resolved.

### 2.2 Project manifest (PM)

The manifest is the semantic hub — the single artifact every other module reads from and writes to, persisted through `ug-knowledge save-text`.

| Section | Contents | Primary contributors |
|---|---|---|
| Identity | Project name, authorized root path, disciplines present, analysis timestamp | Discovery |
| Inventory | Real paths, types, sizes, timestamps, hashes, assigned role | Discovery |
| Discipline map | Which files belong to which engineering discipline, with confidence | Organization |
| Timeline | Ordered events with dates and evidence links | Intelligence |
| Milestones | Each milestone with classification and evidence links | Intelligence |
| Decisions & revisions | Design decisions and revision signals with sources | Intelligence |
| Scope | Original scope/MVP reference vs observed scope | Scope-Creep Guard |
| Open questions | Missing information and dependencies | Intelligence |
| Actions | Prioritized next steps, Next 15-Minute Action, schedule notes | Management |
| Components & costs | Materials, components, specs, quantities, costs — with evidence | Knowledge Capture |
| Lessons learned | Failures, causes, solutions, reusable knowledge | Knowledge Capture |
| Provenance | Which capabilities were used and what they covered | All modules |

The manifest is deliberately the **only** place where reasoning output is materialized. Timelines, classifications and recommendations are regenerated from it, which keeps interpretation auditable and keeps the platform layer free of interpretation.

---

## 3. Capability 1 — Project Organization

### 3.1 File discovery and categorization

- **What it does:** Walks the user-authorized folder, returns real paths, types, sizes, timestamps and hashes, and proposes a discipline/purpose role for each file.
- **Why it matters:** Every later feature needs a trustworthy inventory; the manifest's inventory section is built from it and nothing downstream can be better than this list.
- **UGREEN support:** **Supported.** `ug-filesystem find` (with `pattern`, `type` incl. `documents`/`image`/`archive`, `min-size`, `max-size`, `max-depth`, `limit`), `ls`, `stat`, `getfattr`, `md5sum`, `sha256sum`, and `file-workflow get-user-dir` — all `read` / approval `none`.
- **CLI / expert:** `ug-filesystem` → `file-agent`; `file-workflow` → `file-agent`.
- **Platform or reasoning:** **HYBRID** — platform returns the inventory; BuildVault assigns disciplines/roles.
- **Limitations:** Type detection is coarse (the `type` enum is generic, e.g. `application`, `documents`), so file-role reasoning must be conservative. `find`'s `date-type` (0..3) semantics are undocumented, so per-file times come from `stat`. `md5sum`/`sha256sum` are excluded for large trees to bound cost.
- **Lifecycle:** **MVP.**

### 3.2 Standardized engineering structure proposal

- **What it does:** Proposes a canonical engineering directory layout (e.g. `CAD/`, `drawings/`, `docs/`, `firmware/`, `tests/`, `media/`) and maps existing files onto it.
- **Why it matters:** Turns an arbitrary pile of files into a navigable project, and gives collaborators an obvious place to put things.
- **UGREEN support:** **Partially supported.** `file-workflow start` (`kind=organize`) can produce a *plan* (`status=planned`) without side effects — but its `by` values (`type`, `btime`, `ctime`, `mtime`, `size`, `image_resolution`, `audio_duration`, `video_duration`, `video_resolution`) cannot express *engineering discipline*.
- **CLI / expert:** `file-workflow start` → `file-agent` (optional, plan-only).
- **Platform or reasoning:** **REASONING** — the engineering taxonomy is BuildVault's; the platform only supplies file facts and an optional mechanical plan.
- **Limitations:** The proposed structure is a **proposal in the manifest only** until the user approves execution below. Never assume the user's naming conventions.
- **Lifecycle:** **MVP** (as a proposal).

### 3.3 User-approved organization

- **What it does:** After explicit approval, creates target directories and moves/renames files into the proposed structure.
- **Why it matters:** Delivers the actual cleanup value while preserving user control.
- **UGREEN support:** **Supported, but every action is gated.** `ug-filesystem mkdir` (gateway), `cpmv` (gateway), `rename` (gateway), `touch` (gateway); `file-workflow batch-move` (workflow, returns `status`/`total`/`succeeded`/`failed`/`renamedFiles`/`hasMore`); `file-workflow run` (workflow, executes a previously created plan).
- **CLI / expert:** `ug-filesystem` → `file-agent`; `file-workflow` → `file-agent`.
- **Platform or reasoning:** **PLATFORM** (execution), gated by **REASONING** (which files go where).
- **Limitations:** All writes are state-change and require approval. `batch-move`'s `data`/`actionType`/`renameBy`/`dateField` shapes are only partly documented (`dateField` ∈ atime|btime|ctime|mtime, plus an undocumented `renameBy` example `date-prefix`), so BuildVault prefers explicit per-file `cpmv` over batch semantics it cannot verify. `del`, `batch-del` and `restore` are **never** used by BuildVault — destructive actions are outside its remit.
- **Lifecycle:** **MVP** (approval-gated, minimal).

### 3.4 Duplicate, outdated, missing and misplaced detection

- **What it does:** Flags byte-identical duplicates, old copies/superseded versions, expected-but-absent artifacts, and files that look like they belong under a different discipline.
- **Why it matters:** Prevents working from a stale drawing or the wrong revision — the classic engineering-data failure.
- **UGREEN support:** **Partially supported.** Duplicates: `ug-filemgr scan-dedupe` (read, none) with `path*` (repeatable) and `scope` ∈ all|documents|images|videos|audio. Outdated/missing/misplaced: **no capability** — there is no version-control, no expected-artifact registry, and no semantic placement model in the catalog.
- **CLI / expert:** `ug-filemgr scan-dedupe` → `file-agent`.
- **Platform or reasoning:** **HYBRID** — duplicates are platform-detected; outdated/missing/misplaced are **REASONING** over timestamps (`stat`), hashes and naming, and must be reported as *assessment*, not fact.
- **Limitations:** `scan-dedupe` detects duplicates, not *which* copy is newest (that comes from `stat` times, which can be unreliable). "Missing" is inferred from what the user told BuildVault is expected; it never proves work was not done. Nothing is deleted or renamed from this module.
- **Lifecycle:** **MVP** for duplicates + a conservative "possibly outdated/duplicate" assessment.

### 3.5 Tagging for discipline navigation (optional)

- **What it does:** Applies NAS tags to files so a project stays navigable in the NAS UI.
- **Why it matters:** Lets the user find "all test reports" without re-running analysis.
- **UGREEN support:** **Supported but gated.** `ug-filemgr tag-add-file` (state-change, **conditional** approval), `tag-add`, `tag-set` (gateway); reads via `tag-list`, `tag-get-by-name`, `tag-get-file`, `tag-filter`.
- **CLI / expert:** `ug-filemgr` → `file-agent`.
- **Platform or reasoning:** **PLATFORM**.
- **Limitations:** This modifies user-visible metadata, so it sits behind the same approval gate as moves. `conditional` approval is not further specified in the catalog, so BuildVault must always ask.
- **Lifecycle:** **Advanced** (after organization is proven).

---

## 4. Capability 2 — Project Intelligence

### 4.1 Timeline reconstruction

- **What it does:** Produces a dated, ordered project history — design starts, revisions, orders, tests, reviews — each entry linked to its evidence.
- **Why it matters:** It is the core of "your projects, understood": the answer to *what happened, in what order, and how do we know*.
- **UGREEN support:** **Not supported as a platform capability.** The catalog has no timeline reconstruction for arbitrary project files. `ug-filesystem find` date filters and `stat` timestamps are *inputs*. `ug-photo timeline` is album photos (state-change, workflow) and `ug-surveillance event-timeline` is surveillance footage — neither is a project document timeline.
- **CLI / expert:** inputs from `ug-filesystem stat` → `file-agent`; dated facts from `ug-document qa` with `intent=period` (or `locate_content`) → `document-agent`.
- **Platform or reasoning:** **REASONING**, assembled from verified dated facts plus file timestamps.
- **Limitations:** Only dates that appear in extracted text or in `stat` can be used. Every entry must carry its evidence record; a date with no source is omitted, not guessed. Where two sources disagree on a date, both are retained and flagged.
- **Lifecycle:** **MVP.**

### 4.2 Milestone tracking and classification

- **What it does:** Classifies each milestone as documented complete, documented in progress, planned, not evidenced, or conflicting, with evidence attached.
- **Why it matters:** Converts a pile of files into an honest status picture, including what is genuinely unknown.
- **UGREEN support:** **Not supported.** No classification capability and no project/milestone schema exists — `ug-document extract`'s `schema` enum is invoice/contract/expense/receipt/medical-report/purchase_order/mixed/mixed_reconciliation.
- **CLI / expert:** evidence from `ug-document extract`/`qa` → `document-agent`; `ug-knowledge collect-evidence` → `knowledge-agent` (read, none, returns `evidence`, `sources`, `coverage`, `failures`/`warnings`).
- **Platform or reasoning:** **REASONING** — the five-class taxonomy and its application are BuildVault's.
- **Limitations:** `qa`/`extract` are query-scoped with `max-files` (default 60) and `body-cap` caps, so `coverage` must be reported; "not evidenced" means *not evidenced in the documents BuildVault could read*, never *not done*.
- **Lifecycle:** **MVP.**

### 4.3 Decisions, revisions and contradictions

- **What it does:** Tracks design revisions and engineering decisions, and identifies contradictions (conflicting dates, versions, measurements, claims) plus missing information and dependencies.
- **Why it matters:** Engineering history is the value; contradictions are the risk.
- **UGREEN support:** **Partially supported.** Detecting *what a document says* is `ug-document qa`/`extract`/`reconcile` (read, none) — `reconcile` explicitly compares across multiple `file` values. Detecting that two verified statements *contradict* is not a platform function.
- **CLI / expert:** `ug-document qa` / `extract` / `reconcile` → `document-agent`.
- **Platform or reasoning:** **HYBRID**.
- **Limitations:** `reconcile` returns a comparison result and coverage; it does not adjudicate which version is correct. BuildVault presents both readings with sources and never picks a winner silently.
- **Lifecycle:** **MVP** for contradiction flagging; full revision-chain reconstruction is **Advanced**.

### 4.4 Milestone evidence checkpoints

- **What it does:** Re-checks the evidence behind a specific milestone on request, so a status can be justified at any time.
- **Why it matters:** Turns status claims into defensible statements before a review, handoff or gate.
- **UGREEN support:** **Supported in input form.** `ug-knowledge collect-evidence` (`query*`, `path`, `extension`, `full`) gathers evidence across a path; `ug-document qa` with `evidence-mode` ∈ balanced|focused|broad returns per-answer evidence.
- **CLI / expert:** `ug-knowledge` → `knowledge-agent`; `ug-document` → `document-agent`.
- **Platform or reasoning:** **HYBRID**.
- **Limitations:** Coverage caps apply; a checkpoint is a snapshot, not continuous verification (there is no monitoring capability — see 8.3).
- **Lifecycle:** **MVP** (as an on-demand re-check) — continuous checkpoints are **Advanced**.

---

## 5. Capability 3 — Project Management

### 5.1 Scope-Creep Guard

- **What it does:** Compares observed work (features, artifacts, commitments found in the evidence) against the stated original scope and MVP, and reports additions, omissions and drift.
- **Why it matters:** The most common way engineering projects fail is by quietly growing beyond their purpose; this makes drift visible and priced.
- **UGREEN support:** **Not supported.** No capability compares stated scope against observed artifacts. The catalog has no scope or goal object at all.
- **CLI / expert:** inputs from `ug-document qa` with `intent=comparison` / `condition` → `document-agent`, plus the user-supplied scope statement in Required input.
- **Platform or reasoning:** **REASONING**. The scope baseline is *user-supplied*; the observed side is *verified*; the delta is *reasoning*.
- **Limitations:** Requires the user (or a scope document the platform can read) to state the original scope. Absence of a feature artifact is reported as "not evidenced", not as "not built". Drift is never auto-corrected.
- **Lifecycle:** **MVP.**

### 5.2 Next 15-Minute Action

- **What it does:** Recommends exactly one specific, achievable next action, with its reason, its evidence basis, and what it unblocks.
- **Why it matters:** Converts analysis into motion; the single most useful output for a user returning after weeks away.
- **UGREEN support:** **Not supported.** No recommendation or prioritization capability exists. `ug-knowledge answer-official` answers official NAS product questions only.
- **CLI / expert:** none — derived from the manifest.
- **Platform or reasoning:** **REASONING**.
- **Limitations:** It is a recommendation, never an action taken. It must be small enough to start immediately, must name its evidence, and must state what it does *not* cover.
- **Lifecycle:** **MVP.**

### 5.3 Prioritized next-step recommendations

- **What it does:** A ranked list of next actions with reasons, dependencies and expected evidence gain.
- **Why it matters:** Gives the user a plan, not just a picture.
- **UGREEN support:** **Not supported** (same basis as 5.2).
- **Platform or reasoning:** **REASONING**.
- **Lifecycle:** **MVP** (ranked list, one highlighted action).

### 5.4 Delayed milestones and schedule adjustment

- **What it does:** Identifies milestones whose evidence is older than planned or whose dependencies are unmet, and suggests schedule adjustments.
- **Why it matters:** Catches drift before it becomes a slipped deadline.
- **UGREEN support:** **Not supported.** There is no scheduling, Gantt, dependency-graph or date-computation capability in the catalog.
- **CLI / expert:** date inputs from `ug-filesystem stat` → `file-agent`.
- **Platform or reasoning:** **REASONING**.
- **Limitations:** No baseline plan exists unless the user supplies one; without it, "delayed" can only mean "no evidence of progress since file X". Suggested adjustments are advisory and must never be presented as a computed schedule.
- **Lifecycle:** **Vision** (user-supplied plan dates would make it **Advanced**).

### 5.5 Handoff briefs

- **What it does:** Generates a compact brief for a collaborator: current state, open questions, decisions to confirm, immediate next steps.
- **Why it matters:** Reduces the cost of handing a project to another engineer.
- **UGREEN support:** **Supported for drafting and persistence.** `ug-document writing` (mixed, **gateway**, `task` ∈ outline|polish|rewrite|expand|compress|draft|minutes, `style`, `template=management-summary`) can shape a document; `ug-knowledge save-text` (state-change, **workflow**) persists it and returns `verified`, `outputFile`, `contentBytes`.
- **CLI / expert:** `ug-document writing` → `document-agent`; `ug-knowledge save-text` → `knowledge-agent`.
- **Platform or reasoning:** **HYBRID** — BuildVault supplies the content; the platform drafts and persists.
- **Limitations:** `writing` is gateway-gated and writes an `output_file`; the content must come from the manifest, so a brief never contains facts absent from it.
- **Lifecycle:** **MVP** as a manifest section; standalone brief file export is **Advanced**.

### 5.6 Role-based task ownership and persistent assignments

- **What it does:** Suggests which role should own each open task and how tasks depend on one another.
- **Why it matters:** Prevents duplicated or orphaned work.
- **UGREEN support:** **Not supported.** No user directory, no assignment store, no task system. `ug-surveillance identity-resolve` and `faces` resolve *camera* identities and are irrelevant here.
- **CLI / expert:** none.
- **Platform or reasoning:** **REASONING**.
- **Limitations:** Suggestions only. Persistent team membership, notifications and accountability are out of scope for the platform — **Vision**.
- **Lifecycle:** **Advanced** (as a suggestion list inside the manifest).

---

## 6. Capability 4 — Engineering Knowledge Capture

### 6.1 Components, materials, specifications, quantities and costs

- **What it does:** Records parts, materials, specs, quantities and costs where documents evidence them, with sources preserved.
- **Why it matters:** Makes a project reconstructable and repairable, and feeds future costing.
- **UGREEN support:** **Partially supported.** `ug-document extract` supports `schema` ∈ auto|invoice|contract|expense|receipt|medical-report|purchase_order|mixed|mixed_reconciliation and `ug-document qa` answers targeted questions — the finance/parts schemas (`invoice`, `expense`, `receipt`, `purchase_order`) are the closest fit for cost evidence. There is **no bill-of-materials or parts-database schema**.
- **CLI / expert:** `ug-document extract` / `qa` → `document-agent`.
- **Platform or reasoning:** **HYBRID** — platform extracts fields; BuildVault assembles the BOM/cost rollup.
- **Limitations:** Aggregation across invoices and receipts is BuildVault arithmetic over extracted items and must be presented as such. Totals inherited from a capped extraction window are incomplete by definition. No price validation is possible.
- **Lifecycle:** **MVP** (evidence-linked tables where documents exist).

### 6.2 Design decisions, revisions, tests and results

- **What it does:** Documents what was decided, what changed, what was tested, and what the results were — each with a source.
- **Why it matters:** This is the difference between a folder and an engineering record.
- **UGREEN support:** **Partially supported** via `ug-document qa` (`intent` qa/content_read/extraction/summary/outline) and `extract`.
- **CLI / expert:** `ug-document` → `document-agent`.
- **Platform or reasoning:** **HYBRID**.
- **Limitations:** Test-result interpretation is reasoning; the platform returns what the document says, with coverage. Numeric results are never recomputed or "corrected".
- **Lifecycle:** **MVP.**

### 6.3 Failures, causes, solutions and lessons learned

- **What it does:** Captures mistakes, failed experiments, their causes and the fixes applied, plus reusable engineering knowledge.
- **Why it matters:** Failure knowledge is the most valuable and most frequently lost asset a project produces.
- **UGREEN support:** **Partially supported.** Evidence can be pulled with `ug-document qa`/`extract` and `ug-knowledge collect-evidence`; no capability organizes or ranks lessons.
- **CLI / expert:** `ug-document`, `ug-knowledge` → `document-agent`, `knowledge-agent`.
- **Platform or reasoning:** **HYBRID** for capture; **REASONING** for synthesis.
- **Limitations:** Only documentable (or transcribed — see 6.4) failures can be captured. Undocumented oral history cannot be recovered; the manifest says so.
- **Lifecycle:** **MVP** (sections in the final report).

### 6.4 Media evidence (photographs, video, audio)

- **What it does:** Reads text and descriptions from images, metadata from photos, and transcripts from audio, so visual and audio evidence can enter the record.
- **Why it matters:** Progress photographs, whiteboard shots and voice notes are often the only evidence for a step.
- **UGREEN support:** **Partially supported and uncertain.** `ug-photo vision-ocr` (read, none), `ug-photo vision-vlm` (read, none, accepts `prompt`), `ug-photo meta` (read, none, EXIF), `ug-knowledge audio-transcription` (read, none, returns `transcriptText`, `segments`, `sourceKind`, `sourcePath`, `quality`, `warnings`), `ug-filemgr mediainfo` (read, none), `ug-video subtitle-search` (read, none).
- **CLI / expert:** `ug-photo` → `photo-agent`; `ug-knowledge audio-transcription` → `knowledge-agent`; `ug-filemgr mediainfo` → `file-agent`.
- **Platform or reasoning:** **PLATFORM** acquisition; **REASONING** interpretation.
- **Limitations:** The audit records these as **uncertain**: whether `vision-ocr`/`vision-vlm` operate on arbitrary project images or only album-indexed photos is undocumented, as are supported formats, prerequisites and error codes (`unknown` for all 78 actions). Therefore media is **degradable**: when it returns empty or `failed`, the manifest records "no media evidence available". `ug-video subtitle-download` is **excluded** (gateway write, not needed). Automatic CAD/STL interpretation is **not** available anywhere in the catalog and remains **Vision**.
- **Lifecycle:** **MVP as optional and degradable** (images + audio only); systematic media indexing is **Advanced**.

### 6.5 Final engineering report

- **What it does:** Produces the comprehensive project report: identity, inventory, timeline, milestones, decisions, components/costs, failures, lessons learned, provenance and recommendations.
- **Why it matters:** The deliverable that preserves everything else; supports portfolios, proposals and handoffs.
- **UGREEN support:** **Supported for drafting and persistence.** `ug-document writing` (`task=draft|minutes|outline`, `style`, `template=management-summary`, mixed, gateway) and `ug-knowledge save-text` (`path`, `content` or `content-ref`, `filename-hint`; state-change, workflow; returns `verified`, `outputFile`, `contentBytes`).
- **CLI / expert:** `ug-document writing` → `document-agent`; `ug-knowledge save-text` → `knowledge-agent`.
- **Platform or reasoning:** **HYBRID** — content from the manifest, persistence by the platform.
- **Limitations:** Report content is limited to what evidence supports; every technical claim carries a source reference. BuildVault does not claim legal, patent or regulatory validity for anything it writes. Saving is approval-gated and the saved path must be a real, user-approved location — BuildVault never guesses a directory.
- **Lifecycle:** **MVP.**

---

## 7. Capability 5 — Cross-Project Knowledge

### 7.1 Reusable components, methods, results and lessons

- **What it does:** Identifies artifacts and knowledge from earlier projects that a new project could reuse.
- **Why it matters:** Stops an engineer from re-solving solved problems; the "knowledge preserved" half of the tagline.
- **UGREEN support:** **Not supported.** No cross-file, cross-project semantic index exists. `ug-knowledge collect-evidence` works within supplied `path` values on a single analysis. `ug-photo search-screen` and `search-picture` search the *photo album* index, not engineering knowledge.
- **CLI / expert:** none available.
- **Platform or reasoning:** **REASONING**, with no platform backing today.
- **Limitations:** Cannot be built without a queryable knowledge base. The honest MVP-equivalent is reading the user's saved manifests as ordinary documents via `ug-document qa` when the user explicitly points at them — a manual, user-scoped lookup, not automatic reuse discovery.
- **Lifecycle:** **Vision.** Concede it explicitly rather than approximating it.

### 7.2 Knowledge recommendation when starting new projects

- **What it does:** Suggests relevant prior knowledge at project start.
- **Why it matters:** Front-loads experience into new work.
- **UGREEN support:** **Not supported** (same basis as 7.1).
- **Platform or reasoning:** **REASONING**.
- **Lifecycle:** **Vision.**

---

## 8. Explicitly unsupported / excluded

| Feature | Why excluded |
|---|---|
| Dynamic scheduling and critical-path analysis | No scheduling or date-arithmetic capability in the catalog |
| Persistent team assignments and notifications | No user directory, assignee or notification capability |
| Automated project monitoring | No monitoring capability for projects. `ug-surveillance` monitors **cameras**, not projects |
| ZIP snapshots / archives | No archive or packaging action in the catalog |
| Automatic CAD/STL interpretation, geometry or mesh analysis | No capability reads CAD/STL geometry; `ug-filemgr mediainfo` covers media metadata only |
| Cross-project intelligence | No cross-project knowledge index (see section 7) |
| Deleting, moving or renaming without approval | Violates toolkit approval rules and BuildVault's non-negotiables |
| Claiming NAS runtime compatibility, upload or installation | The toolkit cannot verify device behavior; `check-skill.mjs` `static-pass` proves neither |

---

## 9. Feature feasibility matrix

Support key: **P** = platform capability (a catalog Action does the work) · **H** = hybrid (platform supplies inputs, BuildVault supplies judgment) · **R** = reasoning only (no platform capability) · **N** = not supported at all.

### 9.1 Project Organization

| Feature | Does | UGREEN | CLI / Action | Expert | Basis | Stage | Key limitation |
|---|---|---|---|---|---|---|---|
| File discovery & categorization | Inventory the authorized folder | **P** | `ug-filesystem find`, `ls`, `stat`, `getfattr`, `md5sum`, `sha256sum`; `file-workflow get-user-dir` | `file-agent` | read / approval none | **MVP** | Coarse type enum; `date-type` semantics undocumented |
| Standardized structure proposal | Propose engineering layout | **H** | `file-workflow start` (plan only, optional) | `file-agent` | read / approval none | **MVP** | Cannot express engineering discipline; proposal lives in the manifest until approved |
| User-approved organization | Create dirs, move/rename files | **P** | `ug-filesystem mkdir`, `cpmv`, `rename`; `file-workflow batch-move`, `run` | `file-agent` | state-change / gateway & workflow | **MVP** | Approval-gated; `batch-move` payload shapes only partly documented; prefer explicit `cpmv` |
| Duplicate detection | Find identical copies | **P** | `ug-filemgr scan-dedupe` | `file-agent` | read / approval none | **MVP** | Detects duplicates, not which copy is newest |
| Outdated / missing / misplaced detection | Flag stale & orphaned files | **R** | `ug-filesystem stat` (inputs) | `file-agent` | read / approval none | **MVP** (assessment) | Assessment only; "missing" never proves work was not done |
| Tag-based navigation | Tag files by discipline | **P** | `ug-filemgr tag-add-file`, `tag-add`, `tag-set`, `tag-filter` | `file-agent` | state-change / conditional & gateway | **Advanced** | Modifies user metadata; approval-gated |

### 9.2 Project Intelligence

| Feature | Does | UGREEN | CLI / Action | Expert | Basis | Stage | Key limitation |
|---|---|---|---|---|---|---|---|
| Timeline reconstruction | Dated project history | **R** | `ug-filesystem stat`; `ug-document qa` (`intent=period`) | `file-agent`, `document-agent` | read / approval none | **MVP** | Only extractable dates; every entry needs evidence; conflicts retained, not resolved |
| Milestone classification | 5-class milestone status | **R** | `ug-document extract`, `qa`; `ug-knowledge collect-evidence` | `document-agent`, `knowledge-agent` | read / approval none | **MVP** | `coverage`/`max-files` caps; no project schema exists |
| Contradiction detection | Flag conflicting claims | **H** | `ug-document reconcile`, `qa`, `extract` | `document-agent` | read / approval none | **MVP** | Platform compares; BuildVault flags; no adjudication |
| Revision chain reconstruction | Full version history | **R** | `ug-document qa`, `extract` | `document-agent` | read / approval none | **Advanced** | Depends entirely on written revision records |
| Evidence checkpoints | Re-verify a milestone | **H** | `ug-knowledge collect-evidence`; `ug-document qa` `evidence-mode` | `knowledge-agent`, `document-agent` | read / approval none | **MVP** (on demand) | Snapshot, not continuous |

### 9.3 Project Management

| Feature | Does | UGREEN | CLI / Action | Expert | Basis | Stage | Key limitation |
|---|---|---|---|---|---|---|---|
| Scope-Creep Guard | Compare scope vs observed | **R** | `ug-document qa` (`intent=comparison`) | `document-agent` | read / approval none | **MVP** | Needs a user-stated scope baseline |
| Next 15-Minute Action | One actionable step | **R** | none | — | — | **MVP** | Recommendation only |
| Prioritized next steps | Ranked action list | **R** | none | — | — | **MVP** | Recommendation only |
| Delayed milestones / schedule adjustment | Detect slippage | **R** | `ug-filesystem stat` | `file-agent` | read / approval none | **Vision** | No baseline plan, no scheduling capability |
| Handoff brief | Collaborator summary | **H** | `ug-document writing`; `ug-knowledge save-text` | `document-agent`, `knowledge-agent` | mixed+state-change / gateway & workflow | **MVP** (manifest section) | Gateway-gated writes; content limited to manifest |
| Role-based ownership | Suggest task owners | **R** | none | — | — | **Advanced** | Suggestions only; no assignee store |

### 9.4 Engineering Knowledge Capture

| Feature | Does | UGREEN | CLI / Action | Expert | Basis | Stage | Key limitation |
|---|---|---|---|---|---|---|---|
| Components & costs | Parts, specs, qty, cost | **H** | `ug-document extract` (`schema=invoice\|expense\|receipt\|purchase_order\|auto`), `qa` | `document-agent` | read / approval none | **MVP** | No BOM schema; rollup is BuildVault arithmetic |
| Decisions, revisions, tests | Engineering record | **H** | `ug-document qa`, `extract` | `document-agent` | read / approval none | **MVP** | Interpretation is reasoning |
| Failures & lessons learned | Capture mistakes | **H** | `ug-document qa`; `ug-knowledge collect-evidence` | `document-agent`, `knowledge-agent` | read / approval none | **MVP** | Only documented/transcribed failures |
| Media evidence | OCR / VLM / EXIF / audio | **P** (uncertain) | `ug-photo vision-ocr`, `vision-vlm`, `meta`; `ug-knowledge audio-transcription`; `ug-filemgr mediainfo` | `photo-agent`, `knowledge-agent`, `file-agent` | read / approval none | **MVP** (degradable) | Album-index dependence, formats, prerequisites unknown |
| Final engineering report | The comprehensive report | **H** | `ug-document writing`; `ug-knowledge save-text` | `document-agent`, `knowledge-agent` | mixed+state-change / gateway & workflow | **MVP** | Approval-gated; no legal/patent validity claimed |

### 9.5 Cross-Project Knowledge

| Feature | Does | UGREEN | CLI / Action | Expert | Basis | Stage | Key limitation |
|---|---|---|---|---|---|---|---|
| Reuse discovery | Find reusable prior knowledge | **N** | none | — | — | **Vision** | No cross-project index |
| New-project knowledge recommendations | Suggest prior knowledge | **N** | none | — | — | **Vision** | Manual user-scoped manifest lookup is the only honest partial |

---

## 10. MVP definition and delegation plan

**MVP scope (deliberately narrow):** authorized project file discovery · evidence-backed timeline reconstruction · milestone classification · engineering project manifest · Scope-Creep Guard · Next 15-Minute Action · prioritized next steps · final engineering report with lessons learned · user-approved file organization and report saving.

Everything else is **Advanced** or **Vision**, per the matrix.

### 10.1 Delegation sequence

The parent Skill delegates only, using `delegate --target <agent-id> --instruction '<task>'` in this order:

1. **`file-agent`** — inventory the authorized root: `ug-filesystem find` + `stat` (+ `md5sum` on small sets), returning real paths, types, sizes and timestamps. *Stop with an honest empty-result report if nothing supported is found.*
2. **`document-agent`** — extract dated facts, milestone evidence, decisions, components and costs from the verified paths, using `ug-document extract` and `qa` with `evidence-mode` set, and report `coverage` and `failures`.
3. **`knowledge-agent`** — (optional) `ug-knowledge collect-evidence` across the same paths when multi-file synthesis is needed.
4. **`photo-agent` / `knowledge-agent`** — (optional, degradable) `ug-photo vision-ocr` / `vision-vlm` / `meta` and `ug-knowledge audio-transcription`. If these return empty or `failed`, record "no media evidence available".
5. **BuildVault (parent)** — assemble the manifest: timeline, milestones, contradictions, Scope-Creep Guard, Next 15-Minute Action, prioritized steps, components/costs, lessons learned, provenance. All of this is reasoning over verified evidence and is labelled as such.
6. **BuildVault (parent)** — present findings for review. Nothing is written while the state is anything other than user-confirmed.
7. **`knowledge-agent`** — after explicit approval, `ug-knowledge save-text` the manifest and the final report.
8. **`file-agent`** — after explicit approval, `ug-filesystem mkdir` / `cpmv` (or `file-workflow batch-move`) for the approved organization.

### 10.2 Why this shape

- **One expert per capability area**, matching the catalog's single `agent` per CLI, so there are no ambiguous delegation targets.
- **Reads are free, writes are gated**: steps 1–4 make no changes; only steps 7–8 mutate, both after approval.
- **Reasoning is concentrated in step 5**, so every interpretive claim is auditable against the manifest.
- **No hidden or private parameters** are passed; the parent collects only the project name, the authorized path and the scope statement.
- **Empty and partial results are first-class**: every module has a defined empty-result behavior, which the checker requires and Stage 4 tests.

---

## 11. Traceability

| Section | Traces to |
|---|---|
| Platform/ reasoning split | `docs/capability-audit.md` §1, §5; `toolkit/references/cli-usage-rules.md`, `expert-orchestration.md` |
| Evidence model | `docs/capability-audit.md` §3 step 4, §4 (no evidence store) |
| Manifest | `docs/capability-audit.md` §3 step 8 (`ug-knowledge save-text`) |
| Unsupported list (§8) | `docs/capability-audit.md` §2.6, §4 (78 actions, all `knowledgeStatus`/`stability` `unknown`) |
| Delegation plan (§10.1) | `toolkit/data/capability-catalog.json` `clis[].agent`; `toolkit/references/completion-and-errors.md` |
| Capability evidence format for the future Skill | `toolkit/assets/skill-template/SKILL.template.md`, `toolkit/references/skill-format.md` |

---

## 12. Status

- `docs/capability-audit.md` — complete (Stage 1).
- `docs/architecture.md` — this document (Stage 2).
- The BuildVault Skill itself is **not implemented**. Next step is Stage 3 (implement the single "Analyze Project" workflow), which must begin from this architecture and the audit, then be validated by the bundled `check-skill.mjs` (whose `static-pass` still proves nothing about NAS runtime).
