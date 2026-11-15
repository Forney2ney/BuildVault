// BuildVault Stage 7 — controlled SIMULATED expert responses.
//
// THIS IS NOT THE UGREEN RUNTIME. Nothing here has been produced by a real UGREEN
// expert agent, `cli.invoke`, or a UGREEN NAS. These fixtures exist only so the
// demonstration and the orchestration tests can exercise the Skill's expected
// behaviour for every delegation status without a device.
//
// Every "evidence" item carries a verbatim `sourceQuote` that must appear literally
// in the referenced fixture file. The harness verifies each quote against the real
// fixture text, so a simulated fact cannot drift from the fixture evidence.

export const MOCK_STATUSES = [
  "completed",
  "failed",
  "cancelled",
  "waiting_user",
  "waiting_approval",
];

// Which mock set a scenario uses. Each entry is deliberately NOT "completed" except
// the first, so the failure paths are exercised rather than assumed.
export const DELEGATION_SCENARIOS = {
  discovery_completed: {
    agent: "file-agent",
    status: "completed",
    instruction:
      "BuildVault project analysis, read only. In the project folder that the user authorized...",
    result: {
      inventory: "__SIGNAL__",
      duplicateGroups: [],
      warnings: [],
    },
  },
  discovery_empty: {
    agent: "file-agent",
    status: "completed",
    result: {
      inventory: [],
      duplicateGroups: [],
      warnings: ["folder is empty or no readable files"],
    },
  },
  document_partial: {
    agent: "document-agent",
    status: "completed",
    result: { facts: "__DOCFACTS__", coverage: { readFiles: 6, totalFiles: 20, capped: true }, failures: [] },
  },
  documents_failed: {
    agent: "document-agent",
    status: "failed",
    result: { partial: true, facts: [], failures: ["document service unavailable"] },
  },
  knowledge_completed: {
    agent: "knowledge-agent",
    status: "completed",
    result: { evidence: "__EVIDENCE__", coverage: { consultedFiles: 8 }, failures: [], warnings: [] },
  },
  photo_failed: {
    agent: "photo-agent",
    status: "failed",
    result: { partial: true, failures: ["image analysis unavailable"] },
  },
  audio_empty: {
    agent: "knowledge-agent",
    status: "completed",
    result: { evidence: [], coverage: { consultedFiles: 0 }, warnings: ["no audio evidence obtained"] },
  },
  save_waiting_approval: {
    agent: "knowledge-agent",
    status: "waiting_approval",
    result: { pendingAction: "save final engineering report", verified: false },
  },
};

// ---------------------------------------------------------------------------
// Domain facts. `sourceQuote` values are copied verbatim from the fixtures and are
// verified against fixture text by the harness (verifyQuotes).
// ---------------------------------------------------------------------------
export const DOCUMENT_FACTS = [
  {
    id: "F-01",
    kind: "objective",
    claim: "Temperature and humidity measured at 1 minute intervals.",
    source: "README.md",
    sourceQuote: "Measure air temperature and relative humidity along the route at 1 minute intervals.",
    basis: "directly documented",
  },
  {
    id: "F-02",
    kind: "scope",
    claim: "Live telemetry deferred to version 2 in the original scope.",
    source: "README.md",
    sourceQuote: "Live telemetry. Deferred to version 2.",
    basis: "directly documented",
  },
  {
    id: "F-03",
    kind: "decision",
    claim: "Live telemetry approved for the version 1 build.",
    source: "docs/meeting-notes.md",
    sourceQuote: "D-2: The live telemetry module was approved for the version 1 build.",
    date: "2025-05-06",
    basis: "directly documented",
  },
  {
    id: "F-04",
    kind: "specification",
    claim: "Battery capacity recorded as 5200 mAh in revision REV-C.",
    source: "docs/design-revisions.md",
    sourceQuote: "Battery: lithium pack, 5200 mAh, 14.4 V nominal.",
    basis: "conflicting",
    conflictsWith: ["F-05"],
  },
  {
    id: "F-05",
    kind: "specification",
    claim: "Battery capacity recorded as 6400 mAh in the compiled summary.",
    source: "docs/conflicting-spec-summary.md",
    sourceQuote: "| Battery capacity | 6400 mAh |",
    basis: "conflicting",
    conflictsWith: ["F-04"],
  },
  {
    id: "F-06",
    kind: "specification",
    claim: "Enclosure ingress rating IP54 in revisions A, B and C.",
    source: "docs/design-revisions.md",
    sourceQuote: "Enclosure ingress rating: IP54.",
    basis: "conflicting",
    conflictsWith: ["F-07"],
  },
  {
    id: "F-07",
    kind: "specification",
    claim: "Enclosure ingress rating IP65 in the compiled summary.",
    source: "docs/conflicting-spec-summary.md",
    sourceQuote: "| Enclosure ingress rating | IP65 |",
    basis: "conflicting",
    conflictsWith: ["F-06"],
  },
  {
    id: "F-08",
    kind: "test result",
    claim: "Runtime 5 h 20 min measured against a minimum 8 h requirement.",
    source: "docs/test-results.md",
    sourceQuote: "Requirement: minimum 8 h. Measured: 5 h 20 min under the documented duty cycle.",
    met: false,
    basis: "directly documented",
  },
  {
    id: "F-09",
    kind: "test result",
    claim: "Temperature accuracy plus or minus 0.3 degrees C, requirement plus or minus 0.5.",
    source: "docs/test-results.md",
    sourceQuote: "Requirement: plus or minus 0.5 degrees C. Measured: plus or minus 0.3 degrees C",
    met: true,
    basis: "directly documented",
  },
  {
    id: "F-10",
    kind: "missing evidence",
    claim: "No PM2.5 particulate test evidence exists anywhere in the fixture.",
    source: "docs/requirements.md",
    sourceQuote: "| REQ-05 | PM2.5 particulate sensing | README.md deferred list | No test evidence located |",
    basis: "missing evidence",
    evidenceNeeded: "A completed particulate sensing test with a measured result, or a statement that the sensor was not fitted.",
  },
  {
    id: "F-11",
    kind: "missing evidence",
    claim: "Relative humidity test T-03 has no recorded result.",
    source: "docs/test-results.md",
    sourceQuote: "Requirement: plus or minus 3 percent. No result was recorded.",
    basis: "missing evidence",
    evidenceNeeded: "A humidity accuracy test result against the reference set.",
  },
  {
    id: "F-12",
    kind: "failure",
    claim: "Right front wheel stopped; cause not confirmed.",
    source: "docs/failure-log.md",
    sourceQuote: "Cause: not confirmed. A loose connector is a possibility, not a verified cause.",
    basis: "directly documented",
    causeStatus: "unknown",
  },
  {
    id: "F-13",
    kind: "failure",
    claim: "SD card corruption cause confirmed as power loss during a write.",
    source: "docs/failure-log.md",
    sourceQuote: "Cause: power loss during a write, confirmed by reproducing the failure twice.",
    basis: "directly documented",
    causeStatus: "confirmed",
  },
  {
    id: "F-14",
    kind: "failure",
    claim: "Telemetry link dropped twice; cause unknown.",
    source: "docs/failure-log.md",
    sourceQuote: "Cause: unknown. Antenna orientation and radio interference were both suggested but",
    basis: "directly documented",
    causeStatus: "unknown",
  },
  {
    id: "F-15",
    kind: "unresolved conflict",
    claim: "Conflicting ingress and battery figures were raised and left unresolved.",
    source: "docs/meeting-notes.md",
    sourceQuote: "D-4: The conflicting ingress and battery figures in the compiled summary document were",
    basis: "directly documented",
  },
];

export const EVIDENCE_ITEMS = [
  {
    id: "EV-01",
    claim: "Version 1 scope required a minimum of 8 hours on one battery charge.",
    source: "README.md",
    sourceQuote: "Minimum 8 hours of operation on one battery charge.",
    basis: "directly documented",
    coverage: "full document",
  },
  {
    id: "EV-02",
    claim: "Obstacle avoidance was deferred to version 2 and remains unapproved as ECR-002.",
    source: "docs/engineering-change-request.md",
    sourceQuote: "Status: PROPOSED, NOT APPROVED. Reviewed in meeting 2025-05-19 and still unapproved.",
    basis: "directly documented",
    coverage: "full document",
  },
  {
    id: "EV-03",
    claim: "The solar top-up panel ECR-003 has had no review.",
    source: "docs/engineering-change-request.md",
    sourceQuote: "Status: PROPOSED, NOT APPROVED. No review has taken place.",
    basis: "directly documented",
    coverage: "full document",
  },
  {
    id: "EV-04",
    claim: "The compiled summary author did not re-check the design records.",
    source: "docs/conflicting-spec-summary.md",
    sourceQuote: "The author of this summary did not compare it against the design revision record",
    basis: "directly documented",
    coverage: "full document",
  },
  {
    id: "EV-05",
    claim: "BOM total requires a mass value that one item does not record.",
    source: "docs/bill-of-materials.csv",
    sourceQuote: "ATL-011,enclosure,Enclosure shell,ABS,1,44,credits,mass not recorded",
    basis: "missing evidence",
    evidenceNeeded: "A measured mass for the enclosure shell.",
  },
  {
    id: "EV-06",
    claim: "Heading drift measurement lacks a stated unit or period.",
    source: "docs/test-results.md",
    sourceQuote: "Whether the drift rate is per hour, per minute, or total over the run is not stated",
    basis: "missing evidence",
    evidenceNeeded: "The instrument identification and the drift rate unit.",
  },
  {
    id: "EV-07",
    claim: "Site count is ambiguous between two and three.",
    source: "notes/ambiguous-notes.txt",
    sourceQuote: "site survey: 2 sites, or 3? the count in the survey notebook does not match",
    basis: "conflicting",
    conflictsWith: ["EV-08"],
  },
  {
    id: "EV-08",
    claim: "The calibration data records two candidate sites.",
    source: "data/calibration.json",
    sourceQuote: '"candidate_sites": 2',
    basis: "conflicting",
    conflictsWith: ["EV-07"],
  },
];
