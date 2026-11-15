// BuildVault Stage 7 — local simulation engine.
//
// Reads the REAL synthetic fixtures and derives an inventory, evidence ledger,
// timeline, milestone register, scope-drift findings, recommendations, handoff
// brief and engineering report.
//
// This is NOT the UGREEN runtime and NOT the Skill. No UGREEN expert has run, no
// `cli.invoke` has executed, no NAS file has been written. It exists so the
// developer can SEE the intended BuildVault workflow on real inputs.
//
// Determinism rules that matter:
//  - Dates are taken only from fixture text; nothing is inferred into a date.
//  - A value that appears twice with different readings is reported as a conflict,
//    never averaged or resolved silently.
//  - Every extracted fact carries the fixture file it came from.

import { readFileSync, statSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DOCUMENT_FACTS, EVIDENCE_ITEMS, DELEGATION_SCENARIOS } from "./mock-experts.mjs";

const root = "C:/Users/User/Projects/BuildVault";
const fixtureRoot = path.join(root, "tests/fixtures/buildvault-synthetic-project");

// ---------------------------------------------------------------- helpers ---
function read(rel) {
  const p = path.join(fixtureRoot, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}
function readBytes(rel) {
  const p = path.join(fixtureRoot, rel);
  return existsSync(p) ? readFileSync(p) : null;
}
function walk(dir, base = dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

function purposeOf(rel) {
  if (/bill-of-materials/.test(rel)) return "BOM / cost record";
  if (/design-revisions/.test(rel)) return "Design revision record";
  if (/requirements/.test(rel)) return "Requirements";
  if (/test-results/.test(rel)) return "Test results";
  if (/failure-log/.test(rel)) return "Failure log";
  if (/progress-log/.test(rel)) return "Progress log";
  if (/meeting-notes/.test(rel)) return "Meeting / decision record";
  if (/change-request/.test(rel)) return "Change request";
  if (/conflicting-spec/.test(rel)) return "Compiled summary (unverified)";
  if (/calibration/.test(rel)) return "Calibration data";
  if (/sensor-readings/.test(rel)) return "Measured dataset";
  if (/ambiguous-notes/.test(rel)) return "Working notes";
  if (/README/.test(rel)) return "Project proposal / scope";
  if (/\.stl$/.test(rel)) return "CAD placeholder (unsupported)";
  if (/\.(png|wav)$/.test(rel)) return "Media";
  return "Documentation";
}

function statusOf(rel, text, bytes) {
  if (bytes === 0) return "empty";
  if (/\.stl$/.test(rel)) return "not analysed — format unsupported";
  if (/\.(png|wav)$/.test(rel)) return "media — no usable evidence";
  if (bytes > 0 && text !== null && text.trim() === "") return "empty";
  if (text === null) return "not analysed — binary format";
  const stripped = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s.*/g, "")
    .replace(/^\s*[-*]\s.*/gm, "")
    .replace(/^\s*\d+\.\s.*/gm, "")
    .replace(/\|.*\|/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length < 40) return "insufficient content";
  return "analysed";
}

// ------------------------------------------------------------ 1. inventory ---
export function buildInventory() {
  const files = walk(fixtureRoot);
  const hashes = new Map();
  const inventory = files.map((rel) => {
    const p = path.join(fixtureRoot, rel);
    const st = statSync(p);
    const bytes = st.size;
    const buf = readBytes(rel);
    const hash = createHash("sha256").update(buf).digest("hex");
    hashes.set(hash, (hashes.get(hash) || []).concat(rel));
    const text = /\.(png|wav|stl)$/.test(rel) ? null : read(rel);
    return {
      path: rel,
      bytes,
      modified: st.mtime.toISOString().slice(0, 10),
      hash,
      purpose: purposeOf(rel),
      analysisStatus: statusOf(rel, text, bytes),
    };
  });

  const duplicateGroups = [...hashes.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([hash, group]) => ({ hash, files: group }));

  return { files: inventory, duplicateGroups };
}

// Verified simulated evidence: every quote must appear literally in the fixture.
export function verifyQuotes() {
  const problems = [];
  const check = (item) => {
    const text = read(item.source);
    if (text === null) {
      problems.push(`${item.id}: source unreadable: ${item.source}`);
      return;
    }
    if (!text.includes(item.sourceQuote)) {
      problems.push(`${item.id}: quote not found verbatim in ${item.source}`);
    }
  };
  DOCUMENT_FACTS.forEach(check);
  EVIDENCE_ITEMS.forEach(check);
  return problems;
}

// -------------------------------------------------------------- 2. timeline ---
// Only dates stated in fixture text are used. Each entry records its source kind.
const DATE_PATTERNS = [
  { re: /\b(2025)-(\d{2})-(\d{2})\b/g, kind: "documented ISO" },
  { re: /\b(2025)\/(\d{2})\/(\d{2})\b/g, kind: "documented ISO (slash form)" },
];

export function buildTimeline() {
  const events = [];
  const seen = new Set();
  for (const rel of ["README.md", "docs/progress-log.md", "docs/design-revisions.md", "docs/test-results.md", "docs/failure-log.md", "docs/meeting-notes.md", "docs/engineering-change-request.md"]) {
    const text = read(rel);
    if (!text) continue;
    for (const { re, kind } of DATE_PATTERNS) {
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        const date = `${m[1]}-${m[2]}-${m[3]}`;
        const line = text.slice(text.lastIndexOf("\n", m.index) + 1, text.indexOf("\n", m.index)).trim();
        const key = `${date}|${line}`;
        if (seen.has(key)) continue;
        seen.add(key);
        events.push({
          date,
          basis: kind === "documented ISO" ? "directly documented" : "directly documented (format restated)",
          sourceKind: "project document",
          source: rel,
          event: line.slice(0, 120) || "(date present, no event text on the stated line)",
        });
      }
    }
  }
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return events;
}

// Dates deliberately left ambiguous by the fixtures. These are reported as
// ambiguous, never assigned.
export function buildAmbiguousDates() {
  return [
    { text: "March 14", source: "docs/progress-log.md", reason: "no year recorded", basis: "missing evidence" },
    { text: "Late April", source: "docs/progress-log.md", reason: "no day recorded, position undetermined", basis: "missing evidence" },
    { text: "Undated", source: "docs/progress-log.md", reason: "no date recorded", basis: "missing evidence" },
    { text: "05/06/2025 09:23", source: "data/sensor-readings.csv", reason: "format differs from the other rows", basis: "directly documented" },
    { text: '"date": "unknown"', source: "data/calibration.json", reason: "date explicitly unknown", basis: "missing evidence" },
  ];
}

// ----------------------------------------------------------- 3. milestones ---
export function buildMilestones() {
  return [
    { id: "REQ-01", requirement: "Four independently driven wheels", classification: "documented complete", sources: ["docs/design-revisions.md"], evidence: "REV-A records the four-wheel skid-steer configuration", basis: "directly documented", verifiedByTest: false },
    { id: "REQ-02", requirement: "Minimum 8 h runtime on one charge", classification: "documented in progress", sources: ["docs/test-results.md"], evidence: "T-01 measured 5 h 20 min against the 8 h requirement", basis: "directly documented", verifiedByTest: true },
    { id: "REQ-03", requirement: "Temperature accuracy within plus or minus 0.5 degrees C", classification: "documented complete", sources: ["docs/test-results.md"], evidence: "T-02 measured plus or minus 0.3 degrees C", basis: "directly documented", verifiedByTest: true },
    { id: "REQ-04", requirement: "Humidity accuracy within plus or minus 3 percent", classification: "not evidenced", sources: ["docs/test-results.md"], evidence: "T-03 has no recorded result", basis: "missing evidence", evidenceNeeded: "A humidity accuracy test result against the reference set", blockedBy: "missing test bench booking" },
    { id: "REQ-05", requirement: "PM2.5 particulate sensing", classification: "not evidenced", sources: ["docs/requirements.md", "docs/bill-of-materials.csv"], evidence: "No test evidence located; BOM item ATL-008 is not selected, quantity 0", basis: "missing evidence", evidenceNeeded: "A completed particulate test, or a statement the sensor was not fitted in version 1" },
    { id: "REQ-06", requirement: "Waypoint upload over cable", classification: "documented complete", sources: ["docs/test-results.md"], evidence: "T-06 uploaded 12 waypoint files without error", basis: "directly documented", verifiedByTest: true },
    { id: "REQ-07", requirement: "SD logging at 1 Hz with no lost records", classification: "documented complete", sources: ["docs/test-results.md"], evidence: "T-04 recorded 21,600 records with zero lost", basis: "directly documented", verifiedByTest: true },
    { id: "REQ-08", requirement: "Ingress protection rated IP54", classification: "conflicting evidence", sources: ["docs/design-revisions.md", "docs/conflicting-spec-summary.md"], evidence: "REV-A/B/C record IP54; the compiled summary records IP65; T-05 has no result", basis: "conflicting", conflictValues: ["IP54", "IP65"], resolutionNeeded: "An enclosure ingress retest, or a decision record naming the authoritative figure" },
    { id: "REQ-09", requirement: "Total vehicle mass under 6 kg", classification: "documented in progress", sources: ["docs/design-revisions.md", "docs/bill-of-materials.csv"], evidence: "REV-B estimated 5.8 kg; REV-C recorded no mass; ATL-011 mass not recorded", basis: "directly documented", verifiedByTest: false, blockedBy: "no measured mass anywhere" },
    { id: "REQ-10", requirement: "Live telemetry", classification: "documented complete", sources: ["docs/meeting-notes.md", "docs/engineering-change-request.md"], evidence: "D-2 and ECR-001 record approval for version 1, which contradicts the original deferred scope", basis: "directly documented", scopeChange: "approved expansion" },
  ];
}

// --------------------------------------------------------------- 4. scope ---
export function buildScopeFindings() {
  return [
    { item: "Live telemetry in version 1", finding: "approved scope expansion", authority: "D-2 and ECR-001, 2025-05-06", sources: ["docs/meeting-notes.md", "docs/engineering-change-request.md"], basis: "directly documented" },
    { item: "Ultrasonic obstacle detection in version 1", finding: "unapproved suggestion", authority: "ECR-002 proposed 2025-05-10, reviewed 2025-05-19, still unapproved", sources: ["docs/engineering-change-request.md", "docs/meeting-notes.md"], basis: "directly documented" },
    { item: "Solar top-up panel", finding: "unapproved suggestion", authority: "ECR-003 proposed 2025-05-14, no review", sources: ["docs/engineering-change-request.md"], basis: "directly documented" },
    { item: "PM2.5 particulate sensing", finding: "not evidenced", authority: "Deferred in the original scope; no evidence of work", sources: ["README.md", "docs/requirements.md"], basis: "missing evidence", note: "Reported as missing evidence, never as scope creep" },
    { item: "Number of prototype sites", finding: "conflicting information", authority: "Ambiguous notes say 2 or 3; calibration data records 2", sources: ["notes/ambiguous-notes.txt", "data/calibration.json"], basis: "conflicting" },
  ];
}

// --------------------------------------------------------- 5. readiness -----
export function buildReadiness() {
  const milestones = buildMilestones();
  const counts = { complete: 0, inProgress: 0, notEvidenced: 0, conflicting: 0, planned: 0 };
  for (const m of milestones) {
    if (m.classification === "documented complete") counts.complete += 1;
    else if (m.classification === "documented in progress") counts.inProgress += 1;
    else if (m.classification === "not evidenced") counts.notEvidenced += 1;
    else if (m.classification === "conflicting evidence") counts.conflicting += 1;
    else if (m.classification === "planned") counts.planned += 1;
  }
  return {
    // Counts only. No percentage and no grade, because the documentation is
    // incomplete by nature.
    counts,
    noScore: true,
    basis: "classification counts over 10 requirements, each with its evidence",
    cannotEstablish: [
      "Whether requirements with no test evidence were physically completed.",
      "The correct value of any figure that two documents disagree on.",
      "Total vehicle mass, because no document records a current figure.",
      "Any percentage completion, because coverage of the project is unknown.",
    ],
  };
}

// --------------------------------------------------- 6. recommendations -----
export function buildRecommendations() {
  const recs = [
    {
      priority: 1,
      action: "Weigh the complete rover on a calibrated scale and record the total mass.",
      reason: "REQ-09 cannot be assessed: REV-C recorded no mass and ATL-011 records none.",
      source: "documented project facts",
      sources: ["docs/design-revisions.md", "docs/bill-of-materials.csv", "docs/requirements.md"],
      dependsOn: "nothing",
      evidenceNeeded: "A measured mass in kilograms, recorded in a document.",
      closesGap: "The unassessable mass requirement.",
      riskIfSkipped: "The version 1 mass requirement cannot be accepted or rejected.",
      basis: "missing evidence",
    },
    {
      priority: 2,
      action: "Run the humidity accuracy test that T-03 never ran, and record the result.",
      reason: "REQ-04 has no supporting measurement anywhere in the project.",
      source: "documented project facts",
      sources: ["docs/test-results.md", "docs/requirements.md"],
      dependsOn: "a humidity reference set and a booked test bench",
      evidenceNeeded: "A measured accuracy figure against the reference set.",
      closesGap: "The missing test result for REQ-04.",
      riskIfSkipped: "A stated requirement has never been verified.",
      basis: "missing evidence",
    },
    {
      priority: 3,
      action: "Identify which document is authoritative for battery capacity and ingress rating, then record a decision.",
      reason: "Five documented values conflict; D-4 records that nobody present could say which is correct.",
      source: "documented project facts",
      sources: ["docs/conflicting-spec-summary.md", "docs/meeting-notes.md", "docs/design-revisions.md"],
      dependsOn: "physical inspection of the battery and an enclosure retest, per D-4",
      evidenceNeeded: "A decision record naming the authoritative source, or a physical measurement.",
      closesGap: "The REQ-08 conflict and two specification conflicts.",
      riskIfSkipped: "Downstream documents keep citing the wrong figure.",
      basis: "conflicting evidence",
    },
    {
      priority: 4,
      action: "Record the cause investigation for the telemetry dropouts as an open item, or close it with a packet capture.",
      reason: "F-03 records the cause as unknown; antenna orientation and interference were suggested but untested.",
      source: "documented project facts",
      sources: ["docs/failure-log.md"],
      dependsOn: "a telemetry session with packet capture",
      evidenceNeeded: "A packet capture or a controlled antenna test.",
      closesGap: "An unexplained field-trial failure.",
      riskIfSkipped: "The failure recurs in the next field trial.",
      basis: "missing evidence",
    },
    {
      priority: 5,
      action: "Resolve the prototype site count and record which survey document is correct.",
      reason: "The notes record 2 or 3; the calibration data records 2; nobody has reconciled them.",
      source: "documented project facts",
      sources: ["notes/ambiguous-notes.txt", "data/calibration.json"],
      dependsOn: "the survey notebook",
      evidenceNeeded: "The survey notebook, or a new site survey.",
      closesGap: "A scope ambiguity affecting the field trial plan.",
      riskIfSkipped: "The trial plan covers the wrong number of sites.",
      basis: "conflicting evidence",
    },
  ];
  return {
    list: recs,
    next15Minute: {
      action: recs[0].action,
      reason: recs[0].reason,
      basis: "missing evidence",
      notCovered: "It does not resolve any conflict, and it does not verify humidity or particulate sensing.",
      startableNow: true,
    },
  };
}

// ------------------------------------------------------- 7. registers -------
export function buildRegisters() {
  return {
    decisionRegister: [
      { id: "D-1", date: "2025-05-06", decision: "Field trial scope confirmed as a single 1 km loop at the north site", reason: "Recorded in the meeting", approval: "recorded as a decision", source: "docs/meeting-notes.md" },
      { id: "D-2", date: "2025-05-06", decision: "Live telemetry module approved for the version 1 build", reason: "The field trial review needed live monitoring", approval: "approved", source: "docs/meeting-notes.md", note: "Contradicts the version 1 scope recorded on 2025-03-10" },
      { id: "D-3", date: "2025-05-06", decision: "Obstacle avoidance remains out of scope; ECR-002 to be reviewed", reason: "No approval given in this meeting", approval: "deferred", source: "docs/meeting-notes.md" },
      { id: "D-4", date: "2025-05-19", decision: "Conflicting ingress and battery figures left unresolved pending inspection", reason: "Nobody present could say which document is correct", approval: "recorded as unresolved", source: "docs/meeting-notes.md" },
      { id: "D-5", date: "2025-05-19", decision: "ECR-002 reviewed again and remains unapproved", reason: "Still a proposal", approval: "not approved", source: "docs/meeting-notes.md" },
    ],
    testRegister: [
      { id: "T-01", date: "2025-05-06", requirement: "REQ-02", outcome: "5 h 20 min against a minimum 8 h", met: false, source: "docs/test-results.md", note: "Duty cycle definition not recorded; single run" },
      { id: "T-02", date: "2025-05-06", requirement: "REQ-03", outcome: "plus or minus 0.3 degrees C against plus or minus 0.5", met: true, source: "docs/test-results.md" },
      { id: "T-03", requirement: "REQ-04", outcome: "no result recorded", met: null, source: "docs/test-results.md", note: "Missing evidence" },
      { id: "T-04", date: "2025-05-06", requirement: "REQ-07", outcome: "21,600 records, zero lost over 6 h at 1 Hz", met: true, source: "docs/test-results.md", note: "Single run" },
      { id: "T-05", requirement: "REQ-08", outcome: "no result recorded", met: null, source: "docs/test-results.md", note: "Missing evidence; enclosure changed after REV-C" },
      { id: "T-06", date: "2025-04-28", requirement: "REQ-06", outcome: "12 waypoint files uploaded without error", met: true, source: "docs/test-results.md" },
      { id: "T-07", date: "2025-06-01", requirement: "unassigned", outcome: "drift 3% over 50 m, unit and period not stated", met: null, source: "docs/test-results.md", note: "Partially usable: value documented, meaning ambiguous" },
    ],
    failureRegister: [
      { id: "F-01", date: "2025-04-05", symptom: "Right front wheel stopped while reversing", action: "Connector reseated; wheel worked afterwards", causeStatus: "unknown", source: "docs/failure-log.md" },
      { id: "F-02", date: "2025-04-28", symptom: "SD card held an unreadable directory after power loss", action: "Card reformatted; graceful shutdown added to firmware", causeStatus: "confirmed", source: "docs/failure-log.md" },
      { id: "F-03", date: "2025-05-06", symptom: "Telemetry link dropped twice during the field trial", action: "Rover continued logging; link recovered on its own", causeStatus: "unknown", source: "docs/failure-log.md" },
    ],
    bom: (() => {
      const text = read("docs/bill-of-materials.csv");
      if (!text) return { lines: [], total: null, incomplete: true };
      const rows = text.trim().split(/\r?\n/).slice(1).map((r) => r.split(","));
      let total = 0;
      let complete = true;
      const lines = rows.map((r) => {
        const qty = Number(r[4]);
        const unit = Number(r[5]);
        if (!Number.isFinite(unit)) complete = false;
        else total += qty * unit;
        return { item: r[0], description: r[2], specification: r[3], quantity: qty, unitCost: unit, total: qty * unit, note: r[7] || "" };
      });
      return { lines, total: complete ? total : null, incomplete: !complete, currency: rows[0]?.[6] || "credits" };
    })(),
  };
}

// ------------------------------------------------------- 8. assembly -------
export function runSimulation() {
  const quoteProblems = verifyQuotes();
  const inventory = buildInventory();
  const timeline = buildTimeline();
  const milestones = buildMilestones();
  const scope = buildScopeFindings();
  const readiness = buildReadiness();
  const recommendations = buildRecommendations();
  const registers = buildRegisters();
  const conflicts = [
    ...DOCUMENT_FACTS.filter((f) => f.basis === "conflicting"),
    ...EVIDENCE_ITEMS.filter((e) => e.basis === "conflicting"),
  ];
  const missing = [...DOCUMENT_FACTS.filter((f) => f.basis === "missing evidence"), ...EVIDENCE_ITEMS.filter((e) => e.basis === "missing evidence")];

  const analysed = inventory.files.filter((f) => f.analysisStatus === "analysed");
  const unusable = inventory.files.filter((f) => f.analysisStatus !== "analysed");

  return {
    meta: {
      project: "Atlas Rover — Autonomous Environmental Monitoring Rover (SYNTHETIC)",
      simulated: true,
      note: "Simulation on synthetic fixtures. No UGREEN expert, cli.invoke or NAS operation was involved.",
      quoteVerification: quoteProblems,
    },
    inventory,
    analysedCount: analysed.length,
    unusableCount: unusable.length,
    unusable,
    timeline,
    ambiguousDates: buildAmbiguousDates(),
    milestones,
    scope,
    readiness,
    recommendations,
    registers,
    conflicts,
    missing,
    quoteProblems,
  };
}

export { fixtureRoot, DELEGATION_SCENARIOS };
