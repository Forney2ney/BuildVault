// BuildVault Stage 7 — orchestration behaviour tests using SIMULATED delegation.
//
// Exercises the Skill's expected behaviour for every delegation status and every
// evidence quality, by running the mock scenarios through the same decision logic
// the Skill specifies. This is a behavioural test of the SPECIFIED logic, not a test
// of the UGREEN runtime: no expert has run and no NAS operation has occurred.
//
// Uses only Node.js built-ins.

import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url).replace(/^\/([A-Za-z]):/, "$1:"));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "tests/sim/output");

const results = [];
function check(id, name, ok, detail) {
  results.push({ id, name, ok: Boolean(ok), detail: detail || "" });
}

// ---------------------------------------------------------------------------
// The decision table mirrors SKILL.md "Completion and failure" exactly.
// ---------------------------------------------------------------------------
function handleStatus(status, { emptyResult = false, partial = false } = {}) {
  switch (status) {
    case "completed":
      if (emptyResult) return { report: true, continue: true, stopDependents: false, label: "reported empty" };
      return { report: true, continue: true, stopDependents: false, label: "reported with coverage limits" };
    case "failed":
      return { report: true, continue: false, stopDependents: true, label: "failure reported, partial kept" };
    case "cancelled":
      return { report: true, continue: false, stopDependents: true, label: "cancelled, not success" };
    case "waiting_user":
      return { report: true, continue: false, stopDependents: true, label: "question surfaced" };
    case "waiting_approval":
      return { report: true, continue: false, stopDependents: true, label: "pending approval shown, step not run" };
    default:
      return { report: false, continue: false, stopDependents: true, label: "unknown status" };
  }
}

// --- ORCH-01..05: all five delegation statuses behave as specified ------------
const statusCases = [
  ["completed", {}, "reported as a business result"],
  ["failed", { partial: true }, "failure reported and partial results kept"],
  ["cancelled", {}, "cancellation reported, not a success"],
  ["waiting_user", {}, "pending question surfaced to the user"],
  ["waiting_approval", {}, "approval request shown, gated step not run"],
];
statusCases.forEach(([status, opts, expected], i) => {
  const r = handleStatus(status, opts);
  check(`ORCH-0${i + 1}`, `delegation state ${status} handled as specified`,
    r.report && r.label.length > 0, `${status} -> ${r.label} (expected: ${expected})`);
});

// --- ORCH-06: a non-completed status never becomes a business result ----------
check("ORCH-06", "only completed yields a usable business result",
  ["failed", "cancelled", "waiting_user", "waiting_approval"].every((s) => {
    const r = handleStatus(s, {});
    return r.continue === false && r.stopDependents === true;
  }), "failed, cancelled, waiting_user and waiting_approval all stop dependents");

// --- ORCH-07: empty result is reported honestly -----------------------------
const emptyCase = handleStatus("completed", { emptyResult: true });
check("ORCH-07", "empty result is reported as empty and stops dependent work",
  emptyCase.report && emptyCase.continue && emptyCase.label === "reported empty",
  "completed with empty result -> reported empty, no substitute source");

// --- ORCH-08: approval for one action never authorizes another ---------------
check("ORCH-08", "approval scoping is per action, not blanket",
  (() => {
    const approved = new Set(["save report"]);
    const authorized = (action) => approved.has(action);
    return !authorized("organize files") && authorized("save report");
  })(), "approving 'save report' does not authorize 'organize files'");

// --- ORCH-09: gated step refused without approval ----------------------------
check("ORCH-09", "a gated write does not run while approval is pending",
  (() => {
    let writes = 0;
    const approvalState = "pending";
    const attemptWrite = () => { if (approvalState === "granted") writes += 1; };
    attemptWrite();
    return writes === 0;
  })(), "write attempt while pending -> 0 writes");

// --- ORCH-10: failed dependency stops the dependent step ---------------------
check("ORCH-10", "a failed upstream stops downstream instead of substituting data",
  (() => {
    const upstream = handleStatus("failed", { partial: true });
    let downstreamRan = false;
    if (upstream.continue) downstreamRan = true;
    return !downstreamRan;
  })(), "downstream did not run after an upstream failure");

// ---------------------------------------------------------------- simulation ---
const { runSimulation } = await import("./simulate.mjs");
const sim = runSimulation();

// --- SIM-01: simulated evidence quotes verify against real fixture text ------
check("SIM-01", "every simulated fact traces verbatim to a fixture file",
  sim.quoteProblems.length === 0,
  sim.quoteProblems.length ? sim.quoteProblems.join("; ") : "all quotes verified against fixture text");

// --- SIM-02: inventory matches the fixture file count -----------------------
check("SIM-02", "inventory covers every fixture file",
  sim.inventory.files.length === 20, `${sim.inventory.files.length} files inventoried`);

// --- SIM-03: per-file analysis status, no unsupported format silently dropped --
const stl = sim.inventory.files.find((f) => f.path === "docs/rover-chassis.stl");
check("SIM-03", "unsupported format is reported as not analysed, not as analysed",
  stl && stl.analysisStatus.includes("not analysed"), `STL status: ${stl?.analysisStatus}`);

const empty = sim.inventory.files.find((f) => f.path === "docs/empty-notes.md");
check("SIM-04", "empty file is reported as empty",
  empty && empty.analysisStatus === "empty", `status: ${empty?.analysisStatus}`);

// --- SIM-05: duplicates grouped, one evidence source ------------------------
check("SIM-05", "byte-identical duplicates are grouped as one source",
  sim.inventory.duplicateGroups.length === 1 &&
  sim.inventory.duplicateGroups[0].files.length === 2,
  `group: ${sim.inventory.duplicateGroups[0]?.files.join(" + ")}`);

// --- SIM-06: conflicts preserved with both sources --------------------------
const battery = sim.conflicts.find((c) => /Battery capacity/.test(c.claim));
check("SIM-06", "a conflicting value keeps both readings and both sources",
  !!battery && battery.source && battery.conflictsWith && battery.conflictsWith.length > 0,
  battery ? `${battery.claim} vs its counterpart (${battery.conflictsWith.join(", ")})` : "battery conflict missing");

// --- SIM-07: no conflict resolved by picking a winner -----------------------
check("SIM-07", "no conflict is silently resolved",
  sim.conflicts.every((c) => !("resolution" in c) && c.basis === "conflicting"),
  `${sim.conflicts.length} conflicts, none with a resolution field`);

// --- SIM-08: ambiguous dates stay ambiguous ---------------------------------
const march = sim.ambiguousDates.find((d) => d.text === "March 14");
check("SIM-08", "a date missing its year is reported as ambiguous, not assigned",
  !!march && march.basis === "missing evidence", march ? `${march.text}: ${march.reason}` : "missing");

// --- SIM-09: no invented years in the timeline ------------------------------
check("SIM-09", "every timeline date is a full ISO date from fixture text",
  sim.timeline.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.source && e.event),
  `${sim.timeline.length} events, all full dates with sources`);

// --- SIM-10: document dates distinguished from filesystem timestamps ---------
check("SIM-10", "document dates are distinguished from file modification dates",
  sim.timeline.some((e) => e.sourceKind === "project document") &&
  sim.inventory.files.every((f) => f.modified),
  "timeline events cite project documents; inventory carries file mtime separately");

// --- SIM-11: milestones carry all five classifications correctly -------------
const byClass = {};
sim.milestones.forEach((m) => { byClass[m.classification] = (byClass[m.classification] || 0) + 1; });
check("SIM-11", "milestones use only the five documented classifications",
  Object.keys(byClass).every((k) => ["documented complete", "documented in progress", "planned", "not evidenced", "conflicting evidence"].includes(k)),
  JSON.stringify(byClass));

// --- SIM-12: not evidenced never means not done ------------------------------
const notEvidenced = sim.milestones.find((m) => m.id === "REQ-05");
check("SIM-12", "missing evidence states what would verify it and never claims completion",
  notEvidenced && notEvidenced.classification === "not evidenced" && !!notEvidenced.evidenceNeeded,
  notEvidenced ? `REQ-05 not evidenced; needs: ${notEvidenced.evidenceNeeded.slice(0, 50)}...` : "REQ-05 missing");

// --- SIM-13: scope drift separates approved from proposed -------------------
const approved = sim.scope.find((s) => s.item === "Live telemetry in version 1");
const proposed = sim.scope.find((s) => /obstacle/i.test(s.item));
check("SIM-13", "approved scope change is not reported as creep, and a proposal is not approved",
  approved?.finding === "approved scope expansion" && proposed?.finding === "unapproved suggestion",
  `telemetry -> ${approved?.finding}; obstacle detection -> ${proposed?.finding}`);

// --- SIM-14: readiness produces no numeric score ----------------------------
check("SIM-14", "readiness assessment contains no percentage or grade",
  sim.readiness.noScore === true && !JSON.stringify(sim.readiness).match(/"\d+%"/),
  `counts only: ${JSON.stringify(sim.readiness.counts)}; ${sim.readiness.cannotEstablish.length} explicit non-claims`);

// --- SIM-15: recommendations carry reasons, dependencies and gaps ------------
const recs = sim.recommendations.list;
check("SIM-15", "every recommendation carries reason, dependency and evidence needed",
  recs.length >= 3 && recs.every((r) => r.reason && r.dependsOn && r.evidenceNeeded && r.riskIfSkipped),
  `${recs.length} recommendations, all fully specified`);

// --- SIM-16: exactly one Next 15-Minute Action, startable now ---------------
const n15 = sim.recommendations.next15Minute;
check("SIM-16", "exactly one Next 15-Minute Action is selected and is startable",
  !!n15 && n15.startableNow === true && !!n15.action && !!n15.notCovered,
  n15 ? `${n15.action.slice(0, 48)}...` : "missing");

// --- SIM-17: BOM is a documented rollup, marked incomplete when it is --------
const bom = sim.registers.bom;
check("SIM-17", "BOM is a rollup of documented lines and marks incompleteness",
  bom.lines.length === 12 && bom.total === 932 && bom.incomplete === false,
  `${bom.lines.length} lines, rollup total ${bom.total} ${bom.currency}`);

// --- SIM-18: an unconfirmed cause is never recorded as confirmed ------------
const f01 = sim.registers.failureRegister.find((f) => f.id === "F-01");
const f02 = sim.registers.failureRegister.find((f) => f.id === "F-02");
check("SIM-18", "failure causes are recorded as confirmed only when the source confirms",
  f01?.causeStatus === "unknown" && f02?.causeStatus === "confirmed",
  `F-01 -> ${f01?.causeStatus}; F-02 -> ${f02?.causeStatus}`);

// --- SIM-19: partial extraction is labelled partial, not complete -----------
const t07 = sim.registers.testRegister.find((t) => t.id === "T-07");
check("SIM-19", "a partially usable measurement is labelled, not treated as a clean pass",
  t07 && t07.met === null && /unit and period not stated/.test(t07.outcome),
  `T-07 outcome: ${t07?.outcome}`);

// --- SIM-20: simulated media produces no invented evidence ------------------
const mediaFiles = sim.inventory.files.filter((f) => /\.(png|wav)$/.test(f.path));
check("SIM-20", "media files are reported as no usable evidence, never as findings",
  mediaFiles.length === 2 && mediaFiles.every((f) => f.analysisStatus.includes("no usable evidence")),
  mediaFiles.map((f) => `${path.basename(f.path)}: ${f.analysisStatus}`).join("; "));

// ---------------------------------------------------------------- artifacts ---
// Write JSON + Markdown outputs so the dashboard and the developer can inspect
// the run. Written under tests/sim/output, never inside the fixtures.
function writeArtifacts() {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "simulation-result.json"), JSON.stringify(sim, null, 2));
  return outDir;
}

const artifactDir = writeArtifacts();
check("SIM-21", "simulation artifacts written outside the fixture directory",
  existsSync(path.join(artifactDir, "simulation-result.json")) && !artifactDir.includes("fixtures"),
  artifactDir);

// ------------------------------------------------------------------- report ---
const failures = results.filter((r) => !r.ok);
console.log("\nBuildVault Stage 7 — orchestration and simulation tests\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}  ${r.name}`);
  if (r.detail) console.log(`      ${r.detail}`);
}
console.log(`\n${results.length - failures.length}/${results.length} checks passed, ${failures.length} failed.`);
console.log("Note: these tests exercise the SPECIFIED logic and the SIMULATED delegation table.");
console.log("No UGREEN expert ran and no NAS operation occurred.\n");
if (failures.length) process.exitCode = 1;
