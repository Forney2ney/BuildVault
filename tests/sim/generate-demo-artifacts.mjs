// BuildVault Stage 7 — demonstration document generator.
// Produces the engineering report and handoff brief as Markdown artifacts from the
// simulation result. Pure Markdown text produced locally; nothing here writes to a
// NAS and nothing here is a UGREEN operation.

import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSimulation } from "./simulate.mjs";

const here = path.dirname(fileURLToPath(import.meta.url).replace(/^\/([A-Za-z]):/, "$1:"));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "tests/sim/output");

const sim = runSimulation();
const inv = sim.inventory;

function esc(s) { return String(s).replace(/\|/g, "\\|"); }

const report = `# ${sim.meta.project}

**SIMULATED DEMONSTRATION ARTIFACT — NOT A UGREEN NAS OPERATION.**

Generated locally from synthetic fixtures by \`tests/sim/simulate.mjs\`. No UGREEN
expert agent ran, no \`cli.invoke\` executed, and no file was written to a NAS.
Every figure below is traceable to a fixture file, and every simulated quote was
verified verbatim against that file's text.

## 1. Executive summary

An engineering project memory was reconstructed from ${inv.files.length} files in the
authorized project folder. ${sim.analysedCount} files yielded usable content and
${sim.unusableCount} did not. The timeline holds ${sim.timeline.length} documented
events. Ten requirements were classified: ${sim.readiness.counts.complete} documented
complete, ${sim.readiness.counts.inProgress} documented in progress,
${sim.readiness.counts.notEvidenced} not evidenced, ${sim.readiness.counts.conflicting}
in conflicting evidence. ${sim.conflicts.length} documented values conflict,
${sim.missing.length} evidence gaps were identified, and no percentage-completion
figure is reported because the documentation is incomplete by nature.

## 2. Objectives and requirements

- Objectives as documented: temperature and humidity measurement at 1 minute
  intervals, autonomous 1 km navigation with return to dock, SD-card logging, cable
  waypoint upload, and survival of light rain and dust. Source: \`README.md\`.
- Requirements REQ-01 to REQ-10 as listed in \`docs/requirements.md\`.

## 3. Design and development history

Revision record: REV-A (2025-03-14) initial chassis, IP54, 60 rpm motors, 5.2 kg;
REV-B (2025-04-20) battery 5000 mAh 14.4 V, 5.8 kg; REV-C (2025-05-22) battery
5200 mAh, motor controller revision B, ingress still IP54 with no retest, mass not
recorded. Source: \`docs/design-revisions.md\`.

## 4. Technical specifications

| Specification | Documented value | Source | Status |
|---|---|---|---|
| Battery capacity | 5200 mAh (REV-C) | \`docs/design-revisions.md\` | **conflicting** — compiled summary records 6400 mAh |
| Battery voltage | 14.4 V | \`docs/design-revisions.md\` | conflicting — compiled summary records 14.8 V |
| Enclosure ingress | IP54 | \`docs/design-revisions.md\` | **conflicting** — compiled summary records IP65 |
| Wheel motor speed | 60 rpm | \`docs/design-revisions.md\` | conflicting — compiled summary records 90 rpm |
| SD card | 32 GB industrial | \`docs/bill-of-materials.csv\` | documented |
| Compute | quad core, 4 GB | \`docs/bill-of-materials.csv\` | documented |
| Total mass | none recorded | \`docs/design-revisions.md\` | **missing** |

## 5. Components and bill of materials

Rollup of ${sim.registers.bom.lines.length} documented BOM lines, total
${sim.registers.bom.total} ${sim.registers.bom.currency}. This is arithmetic over
documented unit costs and quantities, not a validated cost estimate. Item ATL-008
(PM2.5 sensor) is recorded as not selected with quantity 0, and item ATL-011 has no
mass recorded. Source: \`docs/bill-of-materials.csv\`.

## 6. Tests and results

${sim.registers.testRegister.map((t) => `- **${t.id}** (requirement ${t.requirement}): ${t.outcome}. ${t.met === null ? "Outcome not established." : t.met ? "Requirement met." : "Requirement not met."} Source: \`${t.source}\`.`).join("\n")}

## 7. Problems and resolutions

${sim.registers.failureRegister.map((f) => `- **${f.id}** (${f.date}): ${f.symptom}. Action: ${f.action}. Cause status: **${f.causeStatus}**. Source: \`${f.source}\`.`).join("\n")}

Note: F-01 and F-03 record causes that no source confirms. They are reported as
unknown, not as verified diagnoses.

## 8. Lessons learned

- Power loss during SD writes corrupts the file system; a graceful shutdown sequence
  prevents it. Source: \`docs/failure-log.md\` F-02 (cause confirmed, reproduced twice).
- A compiled summary written without re-checking sources introduced five conflicting
  values. Source: \`docs/conflicting-spec-summary.md\` author note.
- A single test run cannot support a reliability claim. Source:
  \`docs/test-results.md\` coverage note.
- An undated entry is not evidence of when work occurred. Source:
  \`docs/progress-log.md\` undated entry.

## 9. Current status

Milestone classification with evidence:

| Requirement | Classification | Evidence | Source |
|---|---|---|---|
${sim.milestones.map((m) => `| ${esc(m.requirement)} | ${m.classification} | ${esc(m.evidence)} | ${m.sources.join(", ")} |`).join("\n")}

## 10. Remaining work

${sim.milestones.filter((m) => m.classification !== "documented complete").map((m) => `- ${m.id}: ${m.classification}. ${m.evidenceNeeded ? `Needed: ${m.evidenceNeeded}.` : ""} ${m.blockedBy ? `Blocked by: ${m.blockedBy}.` : ""}`).join("\n")}

## 11. Evidence appendix

Every simulated fact used in this report carries a verbatim quote that was verified
against the referenced fixture file. ${sim.conflicts.length} conflicts and
${sim.missing.length} gaps are itemised in the JSON artifact.

## 12. Limitations

- This is a local simulation on synthetic data, not a UGREEN NAS analysis.
- ${sim.unusableCount} of ${inv.files.length} files could not be analysed:
  ${inv.files.filter((f) => f.analysisStatus !== "analysed").map((f) => path.basename(f.path)).join(", ")}.
- Extraction coverage was capped, so absence of a fact is not proof of its absence
  from the project.
- No percentage-completion or health score is reported, by design.
- No claim is made about CAD or STL geometry, because no supported capability reads it.
`;

const handoff = `# Handoff Brief — ${sim.meta.project}

**SIMULATED DEMONSTRATION ARTIFACT.** Written for someone who has never seen this
project. Generated locally from synthetic fixtures; no UGREEN NAS operation occurred.

## What the project is

An autonomous ground rover that monitors environmental conditions along a fixed 1 km
route and returns to a docking station. Version 1 scope and objectives are documented
in \`README.md\` (2025-03-10).

## What has been completed

${sim.milestones.filter((m) => m.classification === "documented complete").map((m) => `- ${m.id}: ${m.requirement}. Evidence: ${m.evidence} (\`${m.sources.join(", ")}\`).`).join("\n")}

## What is in progress

${sim.milestones.filter((m) => m.classification === "documented in progress").map((m) => `- ${m.id}: ${m.requirement}. ${m.evidence}.`).join("\n")}

## Decisions that have been made, and by what authority

${sim.registers.decisionRegister.map((d) => `- **${d.id}** (${d.date}): ${d.decision}. Approval: ${d.approval}. Source: \`${d.source}\`.`).join("\n")}

## Where the evidence is

${inv.files.filter((f) => f.analysisStatus === "analysed").slice(0, 8).map((f) => `- \`${f.path}\` — ${f.purpose}.`).join("\n")}
- ... and ${Math.max(0, inv.files.filter((f) => f.analysisStatus === "analysed").length - 8)} further analysed files listed in the inventory.

## What remains incomplete, and what to do first

${sim.recommendations.list.slice(0, 3).map((r) => `${r.priority}. **${r.action}** — ${r.reason} Depends on: ${r.dependsOn}.`).join("\n")}

**Next 15-Minute Action:** ${sim.recommendations.next15Minute.action}
${sim.recommendations.next15Minute.reason} This action does not cover: ${sim.recommendations.next15Minute.notCovered}

## Cautions for the next person

- ${sim.conflicts.length} documented values conflict. Do not quote a figure without
  checking which document it came from.
- ${sim.missing.length} evidence gaps exist. Absence of a document is not proof the
  work was not done.
- Costs in the BOM are a rollup of documented unit costs, not a validated estimate.
`;

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "engineering-report.md"), report);
writeFileSync(path.join(outDir, "handoff-brief.md"), handoff);
writeFileSync(path.join(outDir, "simulation-result.json"), JSON.stringify(sim, null, 2));
console.log(`wrote ${path.join(outDir, "engineering-report.md")} (${report.length} bytes)`);
console.log(`wrote ${path.join(outDir, "handoff-brief.md")} (${handoff.length} bytes)`);
console.log(`wrote ${path.join(outDir, "simulation-result.json")}`);
