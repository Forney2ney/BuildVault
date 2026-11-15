
---
name: BuildVault Development
description: Develop and validate BuildVault, an evidence-based engineering project intelligence Skill for the UGREEN hackathon. Use when implementing, auditing, testing, or documenting BuildVault.
---

# BuildVault Development

## Objective

Build BuildVault: an engineering project intelligence Skill that examines an authorized project folder, reconstructs its documented history, identifies milestone status using evidence, and recommends practical next steps.

Tagline: "Your projects, understood. Your next steps, planned."

## Core workflow

1. Identify the project and the folder the user authorizes.
2. Discover relevant files and supported file types.
3. Extract useful information while preserving source references.
4. Reconstruct a chronological project history.
5. Classify milestones as:
   - Documented complete
   - Documented in progress
   - Planned
   - Not evidenced
   - Conflicting evidence
6. Explain uncertainty and identify missing information.
7. Recommend prioritized next actions with reasons.
8. Present findings for user review before saving or modifying anything.

## Non-negotiable rules

- Never invent project facts, file contents, capabilities, CLI names, Actions, or agent IDs.
- Distinguish documented facts from inferences and recommendations.
- Every important milestone should point to its supporting evidence where possible.
- A missing file or mention does not prove that work was never completed.
- Flag conflicting dates, versions, measurements, and project claims.
- Do not modify, move, delete, or overwrite user files without explicit approval.
- Do not claim a NAS operation or runtime test occurred unless it actually did.
- Respect the UGREEN toolkit's capability catalog and safety rules.
- If a required capability is unavailable, explain the limitation instead of inventing a workaround.

## Development process

Work in small, testable stages.

### Stage 1: Capability audit
Read the UGREEN toolkit documentation and inspect the complete capability catalog and schemas.

Create `docs/capability-audit.md` containing:
- Exact CLI names
- Exact Action names
- Associated expert/agent IDs
- Required parameters
- Read/write or other side effects
- Approval requirements
- Completion and error behavior
- Whether each proposed BuildVault workflow step is supported

Do not implement integrations until this audit is complete.

### Stage 2: Architecture
Create `docs/architecture.md`.
Separate file discovery, extraction, evidence tracking, timeline reconstruction, milestone classification, and recommendations.
Document which parts are platform capabilities and which parts are Skill instructions.

### Stage 3: Minimal viable workflow
Implement one polished workflow: Analyze Project.
Do not add unrelated features before this works.

### Stage 4: Validation
Create representative synthetic project fixtures.
Test missing evidence, conflicting evidence, incomplete projects, mixed file types, and empty folders.
Record actual test results. Never describe an unrun test as passed.

## Working style

- Inspect existing files before changing them.
- Prefer small, reversible changes.
- Explain the purpose of each major implementation decision.
- Keep documentation consistent with the actual implementation.
- Ask before destructive or externally visible actions.
- Do not silently replace existing work.
