# Stage 7 — Feature Matrix

BuildVault development candidate, assessed against the UGREEN toolkit 0.7.3 capability
catalog v2.0.0 (9 CLIs, 78 actions, 6 experts). Every feature is assessed for user value,
the exact toolkit support it needs, its implementation status, its testing status, its
limitations, and its priority.

**Priority key:** P0 essential · P1 high value · P2 conditional or unconfirmed.

**Support key:** PLATFORM — a catalog Action performs it · REASONING — BuildVault derives
it from verified results · HYBRID · NONE — no toolkit route exists.

## Core feature matrix

| Feature | User value | Support | Exact toolkit capabilities | Implementation | Testing | Limitations | Priority |
|---|---|---|---|---|---|---|---|
| Project file discovery and inventory | Everything downstream depends on it | PLATFORM | `ug-filesystem find`, `ls`, `stat` → `file-agent` | Implemented (dev Skill Step 2–3) | Executed & passed (SIM-02) | Type detection is a coarse enum; folder tree depth must be bounded | P0 |
| Duplicate detection | Stops double-counting evidence | PLATFORM | `ug-filemgr scan-dedupe` → `file-agent` | Implemented | Executed & passed (SIM-05) | Detects identical bytes; does not decide which copy is newest | P0 |
| Per-file analysis status | Distinguishes "no findings" from "not analysed" | REASONING | Uses `find`/`ls` real results | Implemented | Executed & passed (SIM-03, SIM-04) | Classification of purpose is an inference, never a fact | P0 |
| Document evidence extraction | The factual basis of the whole Skill | PLATFORM | `ug-document extract`, `qa`, `metadata` → `document-agent` | Implemented (Step 4) | Executed & passed (SIM-01, SIM-09) | Query-scoped with `max-files` and `body-cap` caps; coverage must be reported | P0 |
| Cross-document evidence consolidation | Catches facts a single pass misses | PLATFORM | `ug-knowledge collect-evidence` → `knowledge-agent` | Implemented (Step 5) | Executed & passed (SIM-01) | Works within supplied paths; not a cross-project index | P0 |
| Evidence ledger with provenance | The differentiator: traceable claims | REASONING | none — BuildVault's own model | Implemented | Executed & passed (SIM-01, SIM-06) | Evidence survives only inside the run unless saved | P0 |
| Timeline reconstruction | "Your projects, understood" | REASONING | Inputs: `ug-filesystem stat`, documented dates from `ug-document` | Implemented (Step 9) | Executed & passed (SIM-08, SIM-09, SIM-10) | Only extractable dates; no date is invented | P0 |
| Milestone classification (5 classes) | Honest status picture | REASONING | none | Implemented (Step 11) | Executed & passed (SIM-11, SIM-12) | "Not evidenced" ≠ "not done" | P0 |
| Conflicting-evidence detection | Prevents silently averaging contradictions | HYBRID | `ug-document reconcile`; BuildVault flags | Implemented (Step 11) | Executed & passed (SIM-06, SIM-07) | Platform compares; BuildVault must not pick a winner | P0 |
| Missing-evidence identification | Tells the user what to obtain | REASONING | none | Implemented (Step 11) | Executed & passed (SIM-12) | Absence of a document is never proof of absence of work | P0 |
| Project manifest assembly | The single deliverable artifact | REASONING | none | Implemented (Step 8) | Executed & passed | 14 sections; the Stage 5 Skill used 11 | P0 |
| Scope-drift assessment | Catches quiet expansion | REASONING | none | Implemented (Step 13) | Executed & passed (SIM-13) | Needs user-supplied objectives | P0 |
| Prioritized next steps + Next 15-Minute Action | Converts analysis into motion | REASONING | none | Implemented (Step 15) | Executed & passed (SIM-15, SIM-16) | Advice only; never acted on | P0 |
| Engineering report generation | The preserved artifact | HYBRID | `ug-document writing` (gateway), `ug-knowledge save-text` (workflow) → `document-agent`, `knowledge-agent` | Implemented (Step 17, 19) | Executed & passed (report artifact) | Requires approval; content limited to evidence | P0 |
| Approval-gated saving and organization | Non-negotiable safety | PLATFORM | `ug-knowledge save-text`; `ug-filesystem mkdir`/`cpmv`, `file-workflow batch-move` | Implemented (Steps 19–20) | Executed & passed (ORCH-08, ORCH-09) | Every write is gated; deletion excluded entirely | P0 |

## High-value features (P1)

| Feature | User value | Support | Exact toolkit capabilities | Implementation | Testing | Limitations | Priority |
|---|---|---|---|---|---|---|---|
| Revision relationship assessment | Helps navigate version history | REASONING | `ug-document qa`/`extract` | Implemented (Step 10) | Executed & passed | Only claims a revision link when a document states it | P1 |
| Milestone dependencies and blocked work | Shows what is actually stuck | REASONING | none | Implemented (Step 11) | Executed & passed | Blocking must be sourced, not inferred | P1 |
| Engineering decision register | Institutional memory | REASONING | none | Implemented (Step 12) | Executed & passed | Only documented decisions enter | P1 |
| Test-results register | Verifiable claims | REASONING | none | Implemented (Step 12) | Executed & passed (SIM-19) | Single runs noted; no reliability claim | P1 |
| Failure and troubleshooting register | Learns from mistakes | REASONING | none | Implemented (Step 12) | Executed & passed (SIM-18) | Unconfirmed causes stay unknown | P1 |
| BOM and cost rollup | Real engineering value | HYBRID | `ug-document extract` `schema=invoice\|expense\|receipt\|purchase_order` | Implemented (Step 12) | Executed & passed (SIM-17) | Rollup of documented lines only; no BOM schema exists | P1 |
| Readiness assessment (no score) | Honest project health | REASONING | none | Implemented (Step 14) | Executed & passed (SIM-14) | No percentage, no grade — never produced | P1 |
| Handoff brief | Collaboration value | HYBRID | `ug-document writing` (gateway) | Implemented (Step 16) | Executed & passed | Content limited to evidence | P1 |
| Plan-only organization proposal | Safe cleanup | PLATFORM | `file-workflow start` (read, no approval) → `file-agent` | Implemented (Step 7) | Executed & passed (static) | Plan only until separately approved | P1 |

## Conditional and deferred (P2)

| Feature | User value | Support | Why deferred | Priority |
|---|---|---|---|---|
| Advanced media analysis (OCR, VLM, transcripts) | Captures visual/audio evidence | PLATFORM but **uncertain** | `ug-photo vision-ocr`/`vision-vlm`, `ug-knowledge audio-transcription` exist, but album-index dependence, formats, prerequisites and error codes are all `unknown` in the catalog. Treated as optional and degradable | P2 |
| Richer BOM and cost extraction | Better costing | PLATFORM (partial) | Only invoice/expense/receipt/purchase-order schemas exist; no parts-database or BOM schema | P2 |
| Cross-project knowledge reuse | Stops re-solving solved problems | **NONE** | No cross-project index exists in the catalog. Cannot be implemented without inventing a capability | P2 |
| CAD / STL interpretation | Direct engineering value | **NONE** | No catalog action reads CAD geometry. Explicitly excluded | P2 |
| Dynamic scheduling and critical path | Schedule intelligence | **NONE** | No scheduling or date-arithmetic capability | P2 |
| Continuous monitoring | Live awareness | **NONE** | `ug-surveillance` monitors cameras, not projects | P2 |
| ZIP snapshots / archives | Portability | **NONE** | No archive action in the catalog | P2 |
| Percentage-completion or health scoring | Simple readout | **Deliberately refused** | Would manufacture a number from incomplete documentation | P2 |

## Net effect

**0 features faked.** Every implemented feature is either a catalog action or clearly
labelled BuildVault reasoning. Every unimplementable feature is documented as future
work rather than approximated.
