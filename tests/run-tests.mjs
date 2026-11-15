// BuildVault Stage 4 — deterministic test suite.
//
// Uses ONLY Node.js built-in modules. No third-party packages.
// Run from the repository root:  node tests/run-tests.mjs
//
// This suite validates things that are genuinely checkable without a NAS:
//   1. Fixture integrity   — files exist, empty files are empty, conflicts really
//                            conflict, ambiguous dates are present, no stray files.
//   2. Static Skill checks — delegation mappings against the real catalog, delegate
//                            command shape, required headings, status coverage.
//   3. Protected files     — toolkit, Stage 1 audit and Stage 2 architecture unchanged.
//
// It does NOT execute the Skill, does NOT call cli.invoke, does NOT simulate a
// delegated NAS expert and does NOT write into the fixture directory (except when
// --update-manifest is used, which writes only tests/fixture-manifest.json).
//
// Exit code 0 = all checks passed, 1 = at least one check failed, 2 = setup error.

import { existsSync, statSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const fixtureRoot = path.join(root, "tests/fixtures/buildvault-synthetic-project");
const skillDir = path.join(root, "buildvault-skill/buildvault-project-intelligence");
const skillPath = path.join(skillDir, "SKILL.md");
const manifestPath = path.join(here, "fixture-manifest.json");
const updateManifest = process.argv.includes("--update-manifest");

const results = [];
function check(id, name, ok, detail) {
  results.push({ id, name, ok: Boolean(ok), detail: detail || "" });
}
function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}
function read(file) {
  return readFileSync(file, "utf8");
}
function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

// ---------------------------------------------------------------- fixture set ---
const expectedFiles = [
  "README.md",
  "docs/requirements.md",
  "docs/progress-log.md",
  "docs/design-revisions.md",
  "docs/bill-of-materials.csv",
  "docs/bill-of-materials-copy.csv",
  "docs/test-results.md",
  "docs/failure-log.md",
  "docs/meeting-notes.md",
  "docs/engineering-change-request.md",
  "docs/conflicting-spec-summary.md",
  "docs/empty-notes.md",
  "docs/untitled.md",
  "docs/noise-only-notes.txt",
  "docs/rover-chassis.stl",
  "notes/ambiguous-notes.txt",
  "data/sensor-readings.csv",
  "data/calibration.json",
  "media/chassis-photo.png",
  "media/field-trial-audio.wav",
];

// ============================== 1. FIXTURE INTEGRITY ============================
check("T-FIX-01", "fixture root exists", existsSync(fixtureRoot) && statSync(fixtureRoot).isDirectory(), fixtureRoot);

const missing = expectedFiles.filter((f) => !existsSync(path.join(fixtureRoot, f)));
check("T-FIX-02", `all ${expectedFiles.length} expected fixture files exist`, missing.length === 0,
  missing.length ? "missing: " + missing.join(", ") : "all present");

const actual = walk(fixtureRoot);
const extra = actual.filter((f) => !expectedFiles.includes(f));
const absent = expectedFiles.filter((f) => !actual.includes(f));
check("T-FIX-03", "no unexpected files in the fixture directory", extra.length === 0 && absent.length === 0,
  extra.length ? "unexpected: " + extra.join(", ") : absent.length ? "absent: " + absent.join(", ") : `${actual.length} files, exact match`);

const emptyPath = path.join(fixtureRoot, "docs/empty-notes.md");
check("T-FIX-04", "empty document is genuinely empty", existsSync(emptyPath) && statSync(emptyPath).size === 0,
  `${statSync(emptyPath).size} bytes`);

const titleOnly = read(path.join(fixtureRoot, "docs/untitled.md")).trim();
check("T-FIX-05", "title-only document has no usable content", titleOnly.length < 40 && !/\d/.test(titleOnly),
  `${titleOnly.length} chars: ${JSON.stringify(titleOnly)}`);

// Conflicting values: for each conflict, name BOTH source documents, pull the value
// out of each, and assert the two values genuinely differ. Testing presence alone
// would pass a fixture that merely mentions both figures without disagreeing.
const fixtureReads = {};
function textAt(rel) {
  if (!(rel in fixtureReads)) fixtureReads[rel] = read(path.join(fixtureRoot, rel));
  return fixtureReads[rel];
}
const conflictDefs = [
  { name: "battery capacity", fileA: "docs/design-revisions.md", reA: /REV-C[\s\S]{0,300}?(\d{4})\s*mAh/, fileB: "docs/conflicting-spec-summary.md", reB: /Battery capacity\D{0,20}(\d{4})\s*mAh/i },
  { name: "ingress rating", fileA: "docs/design-revisions.md", reA: /(IP\d{2})/, fileB: "docs/conflicting-spec-summary.md", reB: /(IP\d{2})/ },
  { name: "field trial date", fileA: "docs/progress-log.md", reA: /(2025-05-\d{2})/, fileB: "docs/conflicting-spec-summary.md", reB: /field trial date\D{0,20}(\d{4}-\d{2}-\d{2})/i },
  { name: "temperature accuracy", fileA: "docs/test-results.md", reA: /Measured: plus or minus (0\.\d) degrees C/i, fileB: "docs/conflicting-spec-summary.md", reB: /plus or minus (0\.\d) degrees C/i },
  { name: "motor speed", fileA: "docs/design-revisions.md", reA: /(\d{2}) rpm/i, fileB: "docs/conflicting-spec-summary.md", reB: /Wheel motor speed\D{0,20}(\d{2}) rpm/i },
];
const conflictResults = conflictDefs.map((c) => {
  const a = (textAt(c.fileA).match(c.reA) || [])[1] ?? null;
  const b = (textAt(c.fileB).match(c.reB) || [])[1] ?? null;
  return { ...c, a, b, ok: a !== null && b !== null && a !== b };
});
const conflictFailures = conflictResults.filter((c) => !c.ok);
check("T-FIX-06", "conflicting records hold genuinely different values in the named source files",
  conflictFailures.length === 0,
  conflictFailures.length
    ? "unverified: " + conflictFailures.map((c) => `${c.name} (${c.fileA}=${c.a}, ${c.fileB}=${c.b})`).join("; ")
    : conflictResults.map((c) => `${c.name}: ${c.a} vs ${c.b}`).join(" | "));

const ambiguous = [
  /\bMarch 14\b/.test(textAt("docs/progress-log.md")) && !/March 14[^\n]{0,12}(19|20)\d\d/.test(textAt("docs/progress-log.md")),
  /\bLate April\b/.test(textAt("docs/progress-log.md")),
  /\bUndated\b/.test(textAt("docs/progress-log.md")),
  /\d{2}\/\d{2}\/\d{4}/.test(textAt("data/sensor-readings.csv")),
];
check("T-FIX-07", "ambiguous dates are present (no year, no day, undated, mixed format)",
  ambiguous.every(Boolean), ambiguous.map((v, i) => ["missing-year", "no-day", "undated", "mixed-format"][i] + "=" + v).join(", "));

const requirements = textAt("docs/requirements.md");
const missingEvidence = requirements.includes("No test evidence located") && textAt("docs/test-results.md").includes("## T-03") && textAt("docs/test-results.md").includes("## T-05");
check("T-FIX-08", "missing-evidence requirements exist and point at empty test rows", missingEvidence,
  "REQ-05 has no test evidence; T-03/T-05 have no results");

const evidenceBasis = {
  "directly documented": ["docs/design-revisions.md", "docs/test-results.md", "docs/bill-of-materials.csv"],
  "reasonable inference": ["notes/ambiguous-notes.txt", "data/calibration.json"],
  "missing evidence": ["docs/requirements.md", "docs/test-results.md"],
  "conflicting evidence": ["docs/conflicting-spec-summary.md"],
};
const basisMissing = Object.entries(evidenceBasis).filter(([, files]) => !files.every((f) => existsSync(path.join(fixtureRoot, f))));
check("T-FIX-09", "all four evidence bases are represented by fixtures", basisMissing.length === 0,
  basisMissing.length ? "missing: " + basisMissing.map((b) => b[0]).join(", ") : Object.keys(evidenceBasis).join(", "));

const bom = path.join(fixtureRoot, "docs/bill-of-materials.csv");
check("T-FIX-10", "duplicate file pair is byte-identical", sha256(bom) === sha256(path.join(fixtureRoot, "docs/bill-of-materials-copy.csv")),
  "identical sha256: " + sha256(bom).slice(0, 16) + "...");

const csv = read(path.join(fixtureRoot, "data/sensor-readings.csv"));
const csvRows = csv.trim().split(/\r?\n/);
const csvHeader = csvRows[0].split(",");
const csvMissing = csvRows.slice(1).filter((r) => r.split(",").some((c) => c.trim() === "" || c.trim() === "n/a"));
check("T-FIX-11", "CSV dataset parses and contains missing or unusable values",
  csvHeader[0] === "timestamp" && csvRows.length > 8 && csvMissing.length > 0,
  `${csvRows.length - 1} data rows, ${csvMissing.length} with gaps, ${csvHeader.length} columns`);

const calibrationRaw = read(path.join(fixtureRoot, "data/calibration.json"));
let calibration = null;
try { calibration = JSON.parse(calibrationRaw); } catch { /* invalid */ }
check("T-FIX-12", "calibration JSON is valid and carries an unknown date",
  calibration && Array.isArray(calibration.calibrations) && calibration.calibrations.some((c) => c.date === "unknown"));

const png = readFileSync(path.join(fixtureRoot, "media/chassis-photo.png"));
const wav = readFileSync(path.join(fixtureRoot, "media/field-trial-audio.wav"));
check("T-FIX-13", "media files carry valid format signatures",
  png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  && wav.subarray(0, 4).toString("ascii") === "RIFF" && wav.subarray(8, 12).toString("ascii") === "WAVE",
  `png ${png.length} B, wav ${wav.length} B`);

const stl = read(path.join(fixtureRoot, "docs/rover-chassis.stl"));
check("T-FIX-14", "CAD placeholder is present and explicitly marked out of scope",
  stl.includes("OUT OF SCOPE") && stl.includes("STL"));

// fixture manifest: baseline of hashes, detects accidental modification
const currentHashes = {};
for (const f of expectedFiles) {
  const p = path.join(fixtureRoot, f);
  currentHashes[f] = existsSync(p) ? sha256(p) : null;
}
if (updateManifest) {
  writeFileSync(manifestPath, JSON.stringify({ note: "Baseline sha256 of Stage 4 fixture files. Regenerate with: node tests/run-tests.mjs --update-manifest", fixtures: currentHashes }, null, 2) + "\n");
  console.log(`fixture manifest updated: ${manifestPath}`);
}
let manifestOk = true;
let manifestDetail = "";
if (existsSync(manifestPath)) {
  const baseline = JSON.parse(read(manifestPath)).fixtures;
  const changed = Object.keys(baseline).filter((f) => baseline[f] !== currentHashes[f]);
  manifestOk = changed.length === 0;
  manifestDetail = manifestOk ? `${Object.keys(baseline).length} files match baseline` : "modified: " + changed.join(", ");
} else {
  manifestOk = false;
  manifestDetail = "manifest missing — run node tests/run-tests.mjs --update-manifest";
}
check("T-FIX-15", "no fixture file has been modified since the Stage 4 baseline", manifestOk, manifestDetail);

// source references cited in the test documents must resolve
const testDocs = ["tests/test-cases.md", "tests/fixture-inventory.md", "tests/expected-results.md", "tests/approval-boundary.md"];
const badRefs = [];
for (const doc of testDocs) {
  const p = path.join(root, doc);
  if (!existsSync(p)) continue;
  for (const m of read(p).matchAll(/`((?:docs|notes|data|media)\/[A-Za-z0-9._-]+)`/g)) {
    if (!existsSync(path.join(fixtureRoot, m[1]))) badRefs.push(`${doc} -> ${m[1]}`);
  }
}
check("T-FIX-16", "every fixture path cited in the test documents exists", badRefs.length === 0,
  badRefs.length ? "bad references: " + badRefs.join(", ") : "all cited paths resolve");

// ============================== 2. STATIC SKILL CHECKS =========================
let skillSource = "";
if (existsSync(skillPath)) skillSource = read(skillPath);
check("T-SKILL-01", "SKILL.md exists at the expected path", existsSync(skillPath), skillPath);

const catalog = JSON.parse(read(path.join(root, "toolkit/data/capability-catalog.json")));
const cliAgents = new Map(catalog.clis.map((c) => [c.name, c.agent]));
const allowedAgents = new Set(cliAgents.values());

const fm = skillSource.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
const frontName = fm ? (fm[1].match(/^name:\s*(.+)$/m) || [])[1] : null;
check("T-SKILL-02", "directory name matches frontmatter name", frontName === path.basename(skillDir),
  `name=${frontName} dir=${path.basename(skillDir)}`);

const evHeading = skillSource.match(/^# (?:Generation-time capability evidence)\s*$/m);
const evidence = [];
if (evHeading) {
  const start = evHeading.index + evHeading[0].length;
  const rest = skillSource.slice(start);
  const next = rest.search(/^#\s+/m);
  const section = next === -1 ? rest : rest.slice(0, next);
  for (const m of section.matchAll(/^\s*-\s+`([a-z][a-z0-9-]*)`\s+→\s+`([a-z][a-z0-9-]*)`\s*$/gm)) evidence.push({ cli: m[1], agent: m[2] });
}
check("T-SKILL-03", "capability evidence lines exist and each CLI appears once",
  evidence.length > 0 && new Set(evidence.map((e) => e.cli)).size === evidence.length,
  evidence.map((e) => `${e.cli}->${e.agent}`).join(", "));
check("T-SKILL-04", "every evidence CLI maps to the catalog's unique agent",
  evidence.every((e) => cliAgents.get(e.cli) === e.agent),
  evidence.filter((e) => cliAgents.get(e.cli) !== e.agent).map((e) => e.cli).join(", ") || "all correct");

const delegateTargets = [];
const delegateLines = [];
skillSource.split(/\r?\n/).forEach((line, i) => {
  const s = line.indexOf("delegate --");
  if (s !== -1) { delegateLines.push(i + 1); const m = line.slice(s).match(/--target\s+([a-z-]+)/); if (m) delegateTargets.push(m[1]); }
});
check("T-SKILL-05", "delegate targets are registered experts", delegateTargets.every((t) => allowedAgents.has(t)),
  [...new Set(delegateTargets)].join(", "));
const evidencedAgents = new Set(evidence.map((e) => e.agent));
check("T-SKILL-06", "every delegate target has CLI evidence", delegateTargets.every((t) => evidencedAgents.has(t)),
  `${delegateLines.length} delegate commands on lines ${delegateLines.join(", ")}`);

// delegate command shape (mirrors the official checker)
const shapeProblems = [];
skillSource.split(/\r?\n/).forEach((line, i) => {
  const start = line.indexOf("delegate --");
  if (start === -1) return;
  const cmd = line.slice(start, line.indexOf("`", start) === -1 ? undefined : line.indexOf("`", start));
  const tm = [...cmd.matchAll(/--target/g)];
  const im = [...cmd.matchAll(/--instruction/g)];
  if (tm.length !== 1 || im.length !== 1) shapeProblems.push(`line ${i + 1}: flags`);
  const raw = (cmd.match(/--instruction\s+('[^']*')/) || [])[1];
  if (raw && !/^'(?:[^']|'"'"')*'$/.test(raw)) shapeProblems.push(`line ${i + 1}: quoting`);
  if (raw && /<[^>\n]{1,80}>/.test(raw.slice(1, -1))) shapeProblems.push(`line ${i + 1}: placeholder`);
  if (raw && raw.slice(1, -1).includes("'")) shapeProblems.push(`line ${i + 1}: apostrophe`);
});
check("T-SKILL-07", "all delegate commands are well formed", shapeProblems.length === 0,
  shapeProblems.join("; ") || `${delegateLines.length} commands OK`);

const requiredHeadings = [[/^# (?:Goal|目标)\s*$/mi, "Goal"], [/^# (?:Required input|必需输入)\s*$/mi, "Required input"], [/^# (?:Workflow|Orchestration|专家编排)\s*$/mi, "Workflow"], [/^# (?:Completion and failure|Failure handling|完成与失败)\s*$/mi, "Completion and failure"]];
check("T-SKILL-08", "all four required headings are present", requiredHeadings.every(([re]) => re.test(skillSource)),
  requiredHeadings.filter(([re]) => !re.test(skillSource)).map(([, l]) => l).join(", ") || "Goal, Required input, Workflow, Completion and failure");

const statusTokens = ["completed", "failed", "cancelled", "waiting_user", "waiting_approval"];
check("T-SKILL-09", "all five delegation states are covered", statusTokens.every((t) => skillSource.includes(t)),
  statusTokens.filter((t) => !skillSource.includes(t)).join(", ") || "all five present");

// forbidden patterns (mirrors the official checker's security scan, delegate lines exempt)
const patterns = {
  "nas-like path": /(?:^|[\s"'])\/(?:nas|mnt|volume\d*|shares?)(?:\/|\b)/i,
  "file API": /\b(?:readFile|writeFile|unlink|pathlib|fs\.|open\s*\(|cp\s+|mv\s+|rm\s+|cat\s+)\b/i,
  "internal capability": /\b(?:ug-ai|HERMES|Host CLI|expert[-_ ]?id|correlation[-_ ]?id|request[-_ ]?id)\b/i,
  "compact profile": /\b(?:compact-main-agent|compact-unified-agent|compact profile)\b/i,
  "approval bypass wording": /\b(?:bypass|skip|disable|ignore)[^\n]{0,40}\b(?:gateway|approval|permission|audit)\b/i,
  "remote download": /\b(?:curl|wget)\b|https?:\/\/\S+\s*\|\s*(?:sh|bash)\b/i,
};
const securityHits = [];
skillSource.split(/\r?\n/).forEach((line, i) => {
  if (line.includes("delegate --")) return;
  for (const [name, re] of Object.entries(patterns)) if (re.test(line)) securityHits.push(`${name} @ line ${i + 1}`);
});
const invokeViolations = [];
skillSource.split(/\r?\n/).forEach((line, i) => {
  if (!/\bcli\.invoke\b/.test(line)) return;
  const negated = /(?:do not|don't|never|must not|without)[^\n]{0,24}\bcli\.invoke\b/i.test(line);
  if (!negated) invokeViolations.push(`line ${i + 1}`);
});
check("T-SKILL-10", "no forbidden access, capability or approval-bypass patterns", securityHits.length === 0, securityHits.join("; ") || "none");
check("T-SKILL-11", "cli.invoke appears only in negated context", invokeViolations.length === 0, invokeViolations.join(", ") || "none");
check("T-SKILL-12", "Skill states the local-validation limitation", skillSource.includes("It does not prove upload, installation, device compatibility"), "disclaimer present");

// ============================== 3. PROTECTED FILES =============================
const protectedBaseline = {
  "toolkit/SKILL.md": "7a69238f3737e5686b4f6da74c9214e4655627821d13ce7d574787656713bd17",
  "toolkit/data/capability-catalog.json": "c927fd8e233696cd152baf98468368912c13c08aabeac353f0ee95c46c0428e6",
  "toolkit/scripts/check-lib.mjs": "a4020044c1138f1937777d8a600df9d304ea00bf4f3bd20ae5e00883ad6542a7",
  "toolkit/scripts/check-skill.mjs": "6a9e8ad164862ab787f45e577c2e2bc98cfb31cea10f5ec291cb6550eb51fb52",
  "toolkit/docs/skill-development-standard.md": "99a6a500d7d2714603fc19ce1c1c8d4dd28c434f5d95d52616c000f3d677e866",
  "toolkit/references/expert-orchestration.md": "c693c566b505df280dff6b42d7daff7273f6a7f4a264f847c23bd788bb8ddd7f",
  "toolkit/references/runtime-authoring-lessons.md": "718193931151e237b83d4c51aef230bd3cc8e5679452dd3e06e1d19fb83e2479",
  "toolkit/references/safety-and-approval.md": "79571f436beebec2c7e7a7db5f645fd4bb1597d9e38d6854d3bcdf04866c8e1b",
  "toolkit/references/completion-and-errors.md": "8c945b4605b4330322dc94e31f6ef27734b4c9b07cb9c42569eb6d0211e98501",
  "toolkit/references/cli-usage-rules.md": "b9512181e5ae50e5b4e9a2f1076ea4f0df88a1be5d03073133df4767e2800ed5",
  "docs/capability-audit.md": "e44fd5402bfe0da5c95efac58110922bdf574f3544b09d01cb26c53ca926ba03",
  "docs/architecture.md": "b0c53db06482e481f810d51fc9e01d41cde32c83116f6a892dee696dda110ace",
};
const protectedChanged = Object.entries(protectedBaseline)
  .filter(([file, hash]) => !existsSync(path.join(root, file)) || sha256(path.join(root, file)) !== hash)
  .map(([file]) => file);
check("T-PROT-01", "toolkit, Stage 1 audit and Stage 2 architecture are unchanged", protectedChanged.length === 0,
  protectedChanged.length ? "changed: " + protectedChanged.join(", ") : `${Object.keys(protectedBaseline).length} files match their Stage 4 baseline`);

// ============================== REPORT =========================================
const failures = results.filter((r) => !r.ok);
console.log("\nBuildVault Stage 4 — deterministic test suite\n");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}  ${r.name}`);
  if (r.detail) console.log(`      ${r.detail}`);
}
console.log(`\n${results.length - failures.length}/${results.length} checks passed, ${failures.length} failed.`);
console.log("Note: this suite validates fixtures, static Skill properties and file integrity.");
console.log("It does not execute the Skill and does not simulate a delegated NAS expert.\n");
if (failures.length) process.exitCode = 1;
