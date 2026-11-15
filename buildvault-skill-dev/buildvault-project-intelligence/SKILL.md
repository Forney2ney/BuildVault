---
name: buildvault-project-intelligence
description: Engineering project intelligence for one engineering project folder the user authorizes. Produces an evidence-backed engineering project memory: reconstructed timeline with revision intelligence, milestone status with dependencies, decision and test-result registers, scope-drift assessment, readiness assessment, prioritized next steps, one Next 15-Minute Action, a handoff brief and a final engineering report saved only after user approval. Use when a user asks to analyze, review, understand, organize or summarize an engineering project folder, or asks what to do next on a project.
---

# Goal

Analyze one engineering project folder the user explicitly authorizes and produce an engineering project memory the user can review, keep, hand to a collaborator, or use in a review, school project or competition submission.

The package contains:

- A project manifest covering identity and objectives, disciplines and subsystems, file inventory with source references and per-file analysis status, timeline and milestones, revisions and decisions, components, materials and costs, technical specifications, testing and measured results, problems, failures and resolutions, and lessons learned.
- A reconstructed timeline that separates dates stated in project documents from filesystem timestamps, and marks ambiguous dates as ambiguous.
- A revision assessment that proposes revision relationships only where a document supports the link.
- Milestone classification with dependencies and blocked work.
- An engineering decision register and a test-results register.
- A scope-drift assessment separating approved expansions from unapproved suggestions.
- A readiness assessment that states exactly which evidence it uses and what it cannot establish.
- Prioritized next steps and one specific Next 15-Minute Action.
- A handoff brief for someone who has never seen the project.
- A structured final engineering report.

This Skill orchestrates only. The parent Skill never executes a NAS operation itself, never circumvents a platform approval, and never claims that a NAS operation ran unless a delegated expert reported it as completed.

# Required input

Collect only these items, and only before any delegation:

- The project name as the user states it.
- The exact folder path the user authorizes for analysis. Ask for it, and never guess it, assume it, extend it or narrow it on your own.
- The original project objectives or scope statement, if the user can state one. Optional, and used for the scope-drift and readiness assessments. If absent, report those assessments as unavailable rather than inventing a baseline.

Do not pre-collect parameters that belong to child experts. Do not invent paths, file names, identifiers, dates, dimensions, specifications, costs, test results or conclusions, and do not carry values over from an earlier session unless the user restates them.

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

## Step 3 — Classify the inventory

The discovery result is the inventory used by every later step. From it, keep the real path, the file name, the size, the timestamps, the duplicate report and the stated coverage limits for each file. Use exactly the paths the expert returned; never rewrite or normalize a path. If the expert reported a truncated listing or an unreadable file, keep that limitation attached to the inventory rather than dropping it. Record an analysis status for every file: analysed, not analysed because the format is unsupported, empty, or failed. A file whose format the experts cannot read is reported as not analysed, and never as analysed with no findings. Group duplicate files together and treat each group as one source of evidence, never as independent confirmation. Classify each file by its apparent engineering purpose, and mark the classification as an inference, not as a fact. Identification of a file is not understanding of its contents.

## Step 4 — Analyze the documents

`delegate --target document-agent --instruction 'BuildVault project analysis, read only. Using the real file paths returned by the discovery step for the authorized project folder, analyze the documents and extract evidence for a project manifest: objectives and scope statements, dated events, design decisions and revisions, components and materials with specifications, quantities and costs, test descriptions and measured results, test procedures, problems and failures with causes and resolutions, troubleshooting steps, and lessons learned. Enable evidence mode and set a bounded maximum number of files and body budget so coverage stays reportable. Return every fact together with the file it came from, and return the coverage and failure report. If a document cannot be read, report it as a failure. If a document yields an empty result, say so and continue with the remaining documents.'`

## Step 5 — Consolidate cross-document evidence

`delegate --target knowledge-agent --instruction 'BuildVault project analysis, read only. Consolidate evidence across the documents in the authorized project folder that the discovery step identified. Gather evidence for objectives, requirements and constraints, specifications, decisions, components, costs, tests, failures, troubleshooting and lessons learned. Return the evidence list, the sources, the coverage and any failures or warnings. Do not save anything in this step. If evidence collection returns an empty result, report that no additional cross-document evidence was found and keep the facts already extracted.'`

## Step 6 — Optional media and audio analysis

Both delegations in this step are optional and degradable. Run them only when the inventory contains images or audio. If either returns an empty result, fails, or the capability is unavailable, record that no such evidence was obtained and continue. Never substitute an assumption for missing media evidence.

`delegate --target photo-agent --instruction 'BuildVault project analysis, read only and optional. For the image files in the authorized project folder that the discovery step identified, attempt to read visible text and image content and read the photo metadata. This step is degradable: if image reading is unavailable or unsupported, or returns an empty result or fails, report that no image evidence was obtained and stop this step. Do not create albums and do not modify or move any file.'`

`delegate --target knowledge-agent --instruction 'BuildVault project analysis, read only and optional. For the audio files in the authorized project folder that the discovery step identified, attempt a transcript. This step is degradable: if transcription is unavailable or unsupported, or returns an empty result or fails, report that no audio evidence was obtained and stop this step. Do not save anything in this step.'`

## Step 7 — Optional organization proposal, plan only

`delegate --target file-agent --instruction 'BuildVault project organization proposal, read only. In the authorized project folder, produce a file organization plan using the file workflow planning capability, grouping by the supported file type attribute, and return the plan identifier and the plan contents. Do not run the plan, and do not create, move, rename, modify, tag or delete any file. Return the plan as a real result so the user can review it.'`

The returned plan groups files only by the attributes the platform supports, such as file type. Any mapping of those groups onto engineering subfolders is BuildVault interpretation of the returned plan, not a native platform grouping capability, and must be labelled as such. The plan is a proposal recorded in the manifest. It is executed only in Step 20, after explicit user approval.

## Step 8 — Assemble the project memory

Build the project memory from the verified results only. This is BuildVault reasoning, not a platform capability, and every entry states its basis.

## Step 9 — Reconstruct the timeline

Order events by the dates the documents state. Mark each date as confirmed documented when a source states it, and as inferred chronology when it is derived from file timestamps, naming, or sequence reasoning. Never merge a confirmed date with an inferred one, and never fill a gap with a plausible date. When a date is missing a year, is written in an unclear format, or belongs to an event whose position against its neighbours cannot be established, report it as an ambiguous or undetermined date. Do not supply the missing year and do not place the event in a sequence the evidence does not support. Always state whether a date came from a document or from a filesystem timestamp, because the two have different reliability.

## Step 10 — Assess revision relationships

Where a document records a revision identifier, a version number, or an explicit supersession statement, record the relationship and cite that document. Where two files differ in content but no document links them, report them only as possibly related, and say what evidence would confirm or reject the link. Never state that two files are revisions of one another unless a source states it.

## Step 11 — Classify milestones and identify blocked work

Assign one classification per milestone and attach the evidence that supports it:

- Documented complete: a source states the work is finished.
- Documented in progress: a source states the work is underway or partially done.
- Planned: a source states the work is intended but not started.
- Not evidenced: no source mentions it. Report this as missing evidence, never as proof that the work was not done.
- Conflicting evidence: two or more sources disagree. Show both readings with their sources and do not pick a winner silently.

For every not evidenced item, state what evidence would be needed to verify it. For every conflicting item, state what clarification or additional document would resolve it. Then identify dependencies and blocked work: an item is blocked when a source states it depends on another item that is not documented complete, or when the evidence needed to proceed is missing. State the blocking item and its source. Do not compute a percentage-complete score.

## Step 12 — Build the decision and test registers

Record each documented design decision in the decision register with its date, its source, its stated reason and its approval status. Record each test in the test-results register with its date, the requirement it addresses, the documented outcome, whether the outcome met the requirement, and the source. Record a failure entry with the observed symptom, the action taken, and separately whether the cause was confirmed or unknown. A cause that a source does not confirm is recorded as unknown, never as confirmed. Record an aggregation of costs or quantities as a rollup of the documented lines, and state that basis.

## Step 13 — Assess scope drift

Compare the observed features, artifacts and commitments against the original objectives the user stated. Report additions, omissions and drift. If no objectives were supplied, report the assessment as unavailable instead of manufacturing a baseline. An absent artifact means not evidenced, not not built. Separate an approved scope change from an unapproved suggestion: a change a decision or change record marks as approved is reported as an approved expansion of scope, a feature that remains a proposal is reported as a suggestion, and only unapproved expansion is reported as scope drift.

## Step 14 — Assess readiness

Produce a readiness assessment that names, for each item, the evidence it rests on and what it cannot establish. It may state that a milestone is documented complete, that another has no evidence, and that a third is blocked. It must not produce a numeric score, a percentage, or a grade, because the underlying documentation is incomplete by nature. State explicitly which requirements have no supporting test result, which specifications are unverified, and which figures come from a conflicting source. Where the user supplied the objectives, the assessment may compare against them; where they did not, report the assessment as unavailable.

## Step 15 — Recommend next steps

Produce a prioritized list of next actions. For each action, give the reason for its priority, the dependencies and prerequisites, the evidence needed to proceed, the suggested test or documentation that would close a gap, and the risk of not doing it. Then select exactly one specific Next 15-Minute Action the user can start immediately. Mark each action as supported by documented project facts, or as a general engineering suggestion, so the two are never confused. Every recommendation is advice, never an action taken, and must name what it does not cover.

## Step 16 — Compose the handoff brief

Write a brief for someone who has never seen the project: what the project is, what has been completed, which decisions have been made and by what authority, what evidence exists and where, what remains incomplete, what the next person needs to know, and what they should do first. Every claim carries its source reference and its basis. Do not add context that is not in the evidence.

## Step 17 — Compose the final engineering report

Assemble the report from the project memory: executive summary, objectives and requirements, design and development history, technical specifications, components and bill of materials, documented costs, tests and results, problems and resolutions, lessons learned, current status, remaining work, an evidence appendix, and an explicit limitations section stating what is missing, conflicting or unanalysed. Keep the report limited to what the evidence supports and carry the source reference on every technical claim. BuildVault claims no legal, patent or regulatory validity for anything it writes.

## Step 18 — Present findings for review

Present the project memory, the timeline, the revision assessment, the milestone table with blocked items, both registers, the scope assessment, the readiness assessment, the prioritized steps, the handoff brief and the report to the user. State the coverage limits, the documents that could not be read, the empty results, the unsupported formats and every conflicting item. Ask for review first, and then for approval. Each write step needs its own explicit approval naming the specific action, the content and the destination, and approval for one action is never treated as approval for another.

## Step 19 — Save the report only after approval

Run this delegation only after the user explicitly approves both the content and the destination.

`delegate --target knowledge-agent --instruction 'BuildVault report saving, permitted only after explicit user approval. Save the reviewed project manifest, the handoff brief and the final engineering report as text files in the directory the user approved, using the knowledge save capability with the approved path and file name hint. Use only approved content and the approved destination, and do not overwrite an existing file without saying so. Return the verified result, the output file and the byte count. If approval has not been confirmed, do not run this step.'`

## Step 20 — Optional approved organization

Run this delegation only after the user explicitly approves both the plan from Step 7 and the specific files to move.

`delegate --target file-agent --instruction 'BuildVault file organization, permitted only after explicit user approval. In the authorized project folder, create only the engineering subfolders the user approved and move only the specific files the user approved into their approved destinations. Never delete, never rename and never overwrite. Return the count of files moved and any failures. If approval has not been confirmed, do not run this step.'`

# Manifest structure

The project memory is the single output artifact. Use these sections in this order:

1. Project identity and objectives.
2. Engineering disciplines and subsystems.
3. File inventory, per-file analysis status and source references.
4. Timeline and milestones.
5. Revision assessment.
6. Design revisions and decisions.
7. Components, materials and costs.
8. Technical specifications.
9. Testing and measured results.
10. Problems, failures and resolutions.
11. Lessons learned.
12. Open questions, blocked items and recommended next steps.
13. Engineering decision register.
14. Test-results register.

Every entry carries a source reference taken from a real delegation result. Entries with no source are marked as user supplied or removed. Cost and quantity totals are marked as rollups of the documented lines.

# Evidence and honesty rules

Every important claim states one of five bases:

- Directly documented: a source states it. Keep the source reference.
- Reasonable inference: derived from documents, file metadata or naming. Label it as inference and show what it was derived from.
- Missing evidence: not present in anything read. Label it as missing and never expand it into a claim about the work.
- Conflicting evidence: two sources disagree. Show both, with their sources.
- Unsupported or inaccessible material: the file exists but its format cannot be read by any available capability. Report it as not analysed, never as analysed with no findings.

Never invent specifications, dimensions, costs, test results, completion dates or engineering conclusions. Never present an inference as a documented fact. Never describe a file that no expert returned. Never claim to understand CAD or STL geometry, and never extract a technical dimension from a model, because no available capability does so.

# Approval and write boundaries

Reads require no approval. Every write requires it. This Skill never creates, moves, renames, modifies, tags or deletes a file, and never saves a report, until the user has approved the specific change and its destination in the conversation. Approval for one action is never treated as approval for another. Deletion is outside the scope of this Skill entirely. Report the outcome of an approved write using the verified flags the expert returned, and treat an unapproved request as a reason to present the proposal instead of running it.

# Out of scope for this version

Not implemented here, and not to be approximated: automatic background monitoring, automatic task reassignment, dynamic critical-path rescheduling, snapshot archives, arbitrary CAD or STL interpretation, cross-project knowledge retrieval, a continuously synchronized database, and any numeric project-health or percentage-complete score. If the user asks for one of these, state that the current version does not support it and why.

# Completion and failure

Report a business result only after a delegated expert returns completed.

- completed: use the real results, keep the coverage limits, and continue or present as described above.
- failed: report the failure, keep any partial results that were returned, and stop the dependent step. Do not retry silently and do not substitute another data source.
- cancelled: report that the step was cancelled and stop dependent work. Never report a cancelled step as a success.
- waiting_user: surface the question the expert is waiting on, present what is known so far, and continue only after the user answers.
- waiting_approval: present the pending approval request and the exact change it covers. Never run the gated step and never describe it as done.

If a step returns an empty result, no results or partial coverage, report that plainly, keep the rest of the analysis, and state which parts of the project memory are therefore incomplete. Never present partial coverage as a complete analysis.

Local validation of this Skill proves only that the files were written and statically checked. It does not prove upload, installation, device compatibility, or that any NAS operation ran.

# Third-party and AI disclosure

This Skill package contains one file, `SKILL.md`, which is original Markdown text written for this project. It includes no third-party libraries, code, assets, fonts, binaries, scripts or executables, so no third-party source or license needs to be listed.

The Skill makes no network calls, embeds no credentials, keys or tokens, and sends no data outside the NAS. Every NAS operation is delegated to the UGREEN child experts named in the capability evidence above, and all file operations stay inside the folder the user authorized.

This Skill was authored by the developer with AI assistance from an agentic coding environment, OpenCode, using the model Step 5 Preview. The Skill package contains no code, so no AI generated library or runtime component ships with it.
