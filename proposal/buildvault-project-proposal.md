# BuildVault — Engineering Project Intelligence

UGREEN Hackathon 2026 on AI NAS · Round 1 Project Proposal · Track: Open Innovation

## 1. What does the Skill do?

BuildVault analyzes an engineering project folder the user authorizes on a UGREEN AI NAS, producing an evidence-backed project manifest: reconstructed timeline, milestone status, scope-drift assessment, one Next 15-Minute Action, and a final engineering report.

## 2. Who is the target user, and what problem do they face?

Makers, repair technicians, hobby engineers and small engineering teams keep projects as loose folders of drawings, notes, photographs, bills of materials and test logs. After weeks away, nobody knows what was decided, tested, or done next, and knowledge about failed experiments is lost.

## 3. What is the solution?

A Skill that reads the folder, extracts only documented facts with source references, reconstructs a chronology, classifies each milestone as documented complete, in progress, planned, not evidenced or conflicting, compares work against the original scope, and recommends one next action. Nothing is written without approval.

## 4. What is the main user flow?

The user authorizes one folder. BuildVault delegates discovery to the file expert, document analysis to the document expert, evidence consolidation and transcription to the knowledge expert, and image reading to the photo expert. It then presents manifest, timeline, milestones, scope assessment, next steps and report, saving only after approval.

## 5. What makes it different from conventional AI tools?

Conventional AI chat tools summarize text and average contradictions. BuildVault treats conflicting dates, specifications and test results as first-class findings, keeps both readings with their sources, states what would resolve each, and never converts a missing file into proof that work was not done. Reasoning output is labelled separately.

## 6. Which UGREEN AI NAS capabilities does it use, and at which steps?

Discovery uses ug-filesystem find, ls, stat and md5sum, plus ug-filemgr scan-dedupe. Document analysis uses ug-document extract, qa and metadata. Evidence consolidation uses ug-knowledge collect-evidence. Optional media uses ug-photo vision-ocr, vision-vlm and meta, plus ug-knowledge audio-transcription. Organization planning uses file-workflow start, plan only; execution needs separate approval. Saving uses ug-knowledge save-text. Each step delegates to its single owning expert.

## 7. What is the technical approach?

The Skill is single-file Markdown orchestration: the parent only delegates, never invoking a CLI. Inputs: project name, authorized path, optional objectives. Reads need no approval; writes need per-action approval. Coverage is bounded and reported. Data never leaves the authorized folder. Built with AI assistance using OpenCode; no third-party code ships with it.

## 8. What has been built, what is not built, and what still requires NAS testing?

Built: a 20-step workflow, 14-section manifest, five-basis evidence model, revision intelligence, decision and test registers, dependency and blocked-work analysis, milestone classification, scope-drift, no-score readiness, prioritized recommendations, handoff brief, approval-gated saving. Validated locally: checker static-pass with zero errors and warnings, plus 60 of 60 local fixture and simulation checks. Not built: scheduling, monitoring, CAD or STL interpretation, cross-project retrieval. Not yet tested: NAS execution, delegation, file writes.

## 9. What are two core finalist test cases and one edge case?

Core one: three requirements lacking test results must yield not-evidenced milestones naming the evidence needed, never completion claims. Core two: five conflicting values (battery, ingress, field-trial date, accuracy, motor speed) must stay conflicting with both sources and a resolution. Edge: an empty file, a title-only file, an unsupported-format file and a duplicate must be reported as such, never as findings.

## 10. What are the known limitations, risks and external dependencies?

Limitations: no CAD or STL geometry, no monitoring, no cross-project index, media extraction unverified. Risks: coverage caps may under-report, inferred chronology depends on file timestamps, scope assessment needs user-supplied objectives. Dependencies: the UGREEN capability catalog and registered expert agents, available only on NAS.
