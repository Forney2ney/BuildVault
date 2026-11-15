---
name: buildvault-project-intelligence
description: Engineering project intelligence for one engineering project folder the user authorizes. Produces an evidence-backed project manifest, a reconstructed timeline, milestone classification, a scope-drift assessment, one Next 15-Minute Action, prioritized next steps and a final engineering report that is saved only after user approval. Use when a user asks to analyze, review, understand, organize or summarize an engineering project folder, or asks what to do next on a project.
---

# Goal

Analyze one engineering project folder that the user explicitly authorizes and produce a project intelligence package the user can review, keep and hand to collaborators.

The package contains:

- A project manifest covering project identity and objectives, engineering disciplines and subsystems, file inventory with source references, timeline and milestones, design revisions and decisions, components, materials and costs, technical specifications, testing and measured results, problems, failures and resolutions, lessons learned, and open questions with recommended next steps.
- A reconstructed timeline that separates confirmed documented dates from inferred chronology.
- Milestone classifications: documented complete, documented in progress, planned, not evidenced, and conflicting evidence.
- A scope-drift assessment comparing observed work against the documented original project objectives.
- A prioritized next-step list plus exactly one specific Next 15-Minute Action.
- A structured final engineering report.

This Skill orchestrates only. The parent Skill never executes a NAS operation itself, never circumvents a platform approval, and never claims that a NAS operation ran unless a delegated expert reported it as completed.

# Required input

Collect only these items, and only before any delegation:

- The project name as the user states it.
- The exact folder path the user authorizes for analysis. Ask for it, and never guess it, assume it, extend it or narrow it on your own.
- The original project objectives or scope statement, if the user can state one. This is optional and is used only for the scope-drift assessment. If it is absent, report the scope assessment as unavailable rather than inventing a baseline.

Do not pre-collect parameters that belong to child experts. Do not invent paths, file names, identifiers, dates, specifications, costs or conclusions, and do not carry values over from an earlier session unless the user restates them.

# Generation-time capability evidence

Each capability below has exactly one owning expert in the catalog. The parent Skill delegates only to these targets.

- `ug-filesystem` → `file-agent`
- `ug-filemgr` → `file-agent`
- `file-workflow` → `file-agent`
- `ug-document` → `document-agent`
- `ug-knowledge` → `knowledge-agent`
- `ug-photo` → `photo-agent`

# Workflow

The workflow runs in a fixed order. Every delegation is self-contained, and every downstream step consumes only the real results returned by the step before it. Nothing is written, moved, renamed or deleted until the user approves it.

## Step 1 — Authorize the project

Ask for the project name, the exact folder path the user authorizes, and, when the user can state it, the original project objectives. Say plainly that BuildVault only reads the folder and changes nothing until the user approves.

## Step 2 — Discover the project files

`delegate --target file-agent --instruction 'BuildVault project analysis, read only. In the project folder that the user authorized for this analysis, build a complete file inventory and metadata list. List the folder tree, and for every file collect the real path, the file name, the size and the timestamps. Also request the duplicate scan for the same folder so identical files can be reported. Do not create, move, rename, modify, tag or delete any file. Return the inventory and the duplicate report as real results, and state clearly when the folder is empty, when a listing was truncated, or when nothing could be read. Work only inside the authorized folder.'`

If this delegation returns an empty result or no results, report that the folder holds no readable files and stop the analysis there. Do not substitute a different folder and do not widen the search on your own.

## Step 3 — Carry file metadata forward

The discovery result is the inventory used by every later step. From it, keep the real path, the file name, the size, the timestamps, the duplicate report and the stated coverage limits for each file. Use exactly the paths the expert returned; never rewrite or normalize a path. If the expert reported a truncated listing or an unreadable file, keep that limitation attached to the inventory rather than dropping it. Record an analysis status for every file: analysed, not analysed because the format is unsupported, empty, or failed. A file whose format the experts cannot read is reported as not analysed, and never as analysed with no findings.

## Step 4 — Analyze the documents

`delegate --target document-agent --instruction 'BuildVault project analysis, read only. Using the real file paths returned by the discovery step for the authorized project folder, analyze the documents and extract evidence for a project manifest: objectives and scope statements, dated events, design decisions and revisions, components and materials with specifications, quantities and costs, test descriptions and measured results, problems and failures with causes and resolutions, and lessons learned. Enable evidence mode and set a bounded maximum number of files and body budget so coverage stays reportable. Return every fact together with the file it came from, and return the coverage and failure report. If a document cannot be read, report it as a failure. If a document yields an empty result, say so and continue with the remaining documents.'`

## Step 5 — Consolidate cross-document evidence

`delegate --target knowledge-agent --instruction 'BuildVault project analysis, read only. Consolidate evidence across the documents in the authorized project folder that the discovery step identified. Gather evidence for objectives, milestones, decisions, components, costs, tests, failures and lessons learned. Return the evidence list, the sources, the coverage and any failures or warnings. Do not save anything in this step. If evidence collection returns an empty result, report that no additional cross-document evidence was found and keep the facts already extracted.'`

## Step 6 — Optional media and audio analysis

Both delegations in this step are optional and degradable. Run them only when the inventory contains images or audio. If either returns an empty result, fails, or the capability is unavailable, record that no such evidence was obtained and continue. Never substitute an assumption for missing media evidence.

`delegate --target photo-agent --instruction 'BuildVault project analysis, read only and optional. For the image files in the authorized project folder that the discovery step identified, attempt to read visible text and image content and read the photo metadata. This step is degradable: if image reading is unavailable or unsupported, or returns an empty result or fails, report that no image evidence was obtained and stop this step. Do not create albums and do not modify or move any file.'`

`delegate --target knowledge-agent --instruction 'BuildVault project analysis, read only and optional. For the audio files in the authorized project folder that the discovery step identified, attempt a transcript. This step is degradable: if transcription is unavailable or unsupported, or returns an empty result or fails, report that no audio evidence was obtained and stop this step. Do not save anything in this step.'`

## Step 7 — Assemble the project manifest

Build the manifest from the verified results only. This is BuildVault reasoning, not a platform capability, and every entry below states its basis.

## Step 8 — Reconstruct the timeline

Order events by the dates the documents state. Mark each date as confirmed documented when a source states it, and as inferred chronology when it is derived from file timestamps, naming, or sequence reasoning. Never merge a confirmed date with an inferred one, and never fill a gap with a plausible date. When a date is missing a year, is written in an unclear format, or belongs to an event whose position against its neighbours cannot be established, report it as an ambiguous or undetermined date. Do not supply the missing year and do not place the event in a sequence the evidence does not support.

## Step 9 — Classify milestones

Assign one classification per milestone and attach the evidence that supports it:

- Documented complete: a source states the work is finished.
- Documented in progress: a source states the work is underway or partially done.
- Planned: a source states the work is intended but not started.
- Not evidenced: no source mentions it. Report this as missing evidence, never as proof that the work was not done.
- Conflicting evidence: two or more sources disagree. Show both readings with their sources and do not pick a winner silently.

For every not evidenced item, state what evidence would be needed to verify it. For every conflicting item, state what clarification or additional document would resolve it.

## Step 10 — Extract engineering knowledge

From the verified results, record design decisions and revisions, components and materials with specifications, quantities and costs, tests and measured results, problems with causes and resolutions, and lessons learned. Record a value only when a source supports it. Where the user stated something and no source supports it, mark it as user supplied.

## Step 11 — Assess scope drift

Compare the observed features, artifacts and commitments against the original objectives the user stated. Report additions, omissions and drift. If no objectives were supplied, report the assessment as unavailable instead of manufacturing a baseline. An absent artifact means not evidenced, not not built. Separate an approved scope change from an unapproved suggestion: a change a decision or change record marks as approved is reported as an approved expansion of scope, a feature that remains a proposal is reported as a suggestion, and only unapproved expansion is reported as scope drift.

## Step 12 — Recommend next steps

Produce a prioritized list of next actions with reasons and the evidence behind each, then select exactly one specific Next 15-Minute Action that the user can start immediately. Every recommendation is advice, never an action taken, and must name what it does not cover.

## Step 13 — Compose the final engineering report

Assemble the report from the manifest: identity and objectives, disciplines and subsystems, file inventory with source references, timeline, milestones, components and costs, specifications, test results, failures and resolutions, lessons learned, open questions and next steps. Keep the report limited to what the evidence supports and carry the source reference on every technical claim. BuildVault claims no legal, patent or regulatory validity for anything it writes.

## Step 14 — Present findings for review

Present the manifest, the timeline, the milestone table, the scope assessment, the prioritized steps and the report to the user. State the coverage limits, the documents that could not be read, the empty results and every conflicting item. Ask for review first, and then for approval. Each write step needs its own explicit approval naming the specific action, the content and the destination, and approval for one action is never treated as approval for another.

## Step 15 — Save the report only after approval

Run this delegation only after the user explicitly approves both the content and the destination.

`delegate --target knowledge-agent --instruction 'BuildVault report saving, permitted only after explicit user approval. Save the reviewed project manifest and the final engineering report as text files in the directory the user approved, using the knowledge save capability with the approved path and file name hint. Use only approved content and the approved destination, and do not overwrite an existing file without saying so. Return the verified result, the output file and the byte count. If approval has not been confirmed, do not run this step.'`

## Step 16 — Optional approved organization

Offer the proposed engineering folder layout as a proposal in the manifest, and run this delegation only after the user explicitly approves both the layout and the specific files to move.

`delegate --target file-agent --instruction 'BuildVault file organization, permitted only after explicit user approval. In the authorized project folder, create only the engineering subfolders the user approved and move only the specific files the user approved into their approved destinations. Never delete, never rename and never overwrite. Return the count of files moved and any failures. If approval has not been confirmed, do not run this step.'`

# Manifest structure

The manifest is the single output artifact. Use these sections in this order:

1. Project identity and objectives.
2. Engineering disciplines and subsystems.
3. File inventory and source references.
4. Timeline and milestones.
5. Design revisions and decisions.
6. Components, materials and costs.
7. Technical specifications.
8. Testing and measured results.
9. Problems, failures and resolutions.
10. Lessons learned.
11. Open questions and recommended next steps.

Every entry carries a source reference taken from a real delegation result. Entries with no source are marked as user supplied or removed.

# Evidence and honesty rules

Every important claim states one of four bases:

- Directly documented: a source states it. Keep the source reference.
- Reasonable inference: derived from documents, file metadata or naming. Label it as inference and show what it was derived from.
- Missing evidence: not present in anything read. Label it as missing and never expand it into a claim about the work.
- Conflicting evidence: two sources disagree. Show both, with their sources.

Never invent specifications, costs, test results, completion dates or engineering conclusions. Never present an inference as a documented fact. Never describe a file that no expert returned.

# Approval and write boundaries

Reads require no approval. Every write requires it. This Skill never creates, moves, renames, modifies, tags or deletes a file, and never saves a report, until the user has approved the specific change and its destination in the conversation. Deletion is outside the scope of this Skill entirely. Report the outcome of an approved write using the verified flags the expert returned, and treat an unapproved request as a reason to present the proposal instead of running it.

# Out of scope for this version

Not implemented here, and not to be approximated: automatic background monitoring, automatic task reassignment, dynamic critical-path rescheduling, snapshot archives, arbitrary CAD or STL interpretation, cross-project knowledge retrieval, and a continuously synchronized database. If the user asks for one of these, state that the current version does not support it and why.

# Completion and failure

Report a business result only after a delegated expert returns completed.

- completed: use the real results, keep the coverage limits, and continue or present as described above.
- failed: report the failure, keep any partial results that were returned, and stop the dependent step. Do not retry silently and do not substitute another data source.
- cancelled: report that the step was cancelled and stop dependent work. Never report a cancelled step as a success.
- waiting_user: surface the question the expert is waiting on, present what is known so far, and continue only after the user answers.
- waiting_approval: present the pending approval request and the exact change it covers. Never run the gated step and never describe it as done.

If a step returns an empty result, no results or partial coverage, report that plainly, keep the rest of the analysis, and state which parts of the manifest are therefore incomplete. Never present partial coverage as a complete analysis.

Local validation of this Skill proves only that the files were written and statically checked. It does not prove upload, installation, device compatibility, or that any NAS operation ran.

# Third-party and AI disclosure

This Skill package contains one file, `SKILL.md`, which is original Markdown text written for this project. It includes no third-party libraries, code, assets, fonts, binaries, scripts or executables, so no third-party source or license needs to be listed.

The Skill makes no network calls, embeds no credentials, keys or tokens, and sends no data outside the NAS. Every NAS operation is delegated to the UGREEN child experts named in the capability evidence above, and all file operations stay inside the folder the user authorized.

This Skill was authored by the developer with AI assistance from an agentic coding environment, OpenCode, using the model Step 5 Preview. The Skill package contains no code, so no AI generated library or runtime component ships with it.
