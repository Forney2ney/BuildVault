# BuildVault Stage 4 — Test Cases and Results

Three separate kinds of test live here, and their results mean different things:

1. **Deterministic fixture tests** (`T-FIX-*`) — run by `node tests/run-tests.mjs`.
   These really ran. They prove what the fixtures contain.
2. **Static Skill tests** (`T-SKILL-*`) — also really ran. These prove the Skill's
   *instructions* are structurally correct against the real capability catalog.
3. **Behavioural tests** (`T-A` … `T-J`) — **NOT TESTED: NAS runtime unavailable.**
   The Skill could not be executed because it delegates to UGREEN experts and no
   expert, `cli.invoke`, or NAS is available in this environment. Recorded with a
   manual evaluation checklist so they can be run later.

Nothing in section 3 was run, simulated, or inferred from the Skill's wording.
Instruction coverage is listed separately from behaviour, and is static evidence only.

---

## 1. Deterministic fixture tests — actually executed

Command: `node tests/run-tests.mjs` — **29/29 PASS, exit code 0.**

| ID | Test | Result | Evidence |
|---|---|---|---|
| T-FIX-01 | Fixture root exists | PASS | `tests/fixtures/buildvault-synthetic-project` |
| T-FIX-02 | All 20 expected fixture files exist | PASS | all 20 present |
| T-FIX-03 | No unexpected files in the fixture directory | PASS | 20 files, exact match |
| T-FIX-04 | Empty document is genuinely empty | PASS | `docs/empty-notes.md` = 0 bytes |
| T-FIX-05 | Title-only document has no usable content | PASS | `docs/untitled.md` = 13 chars, `# Atlas notes`, no digits |
| T-FIX-06 | Conflicting records hold different values **in the named source files** | PASS | battery 5200 vs 6400; ingress IP54 vs IP65; field trial 2025-05-06 vs 2025-05-13; temperature 0.3 vs 0.6; motor 60 vs 90 rpm |
| T-FIX-07 | Ambiguous dates present | PASS | missing-year, no-day, undated, mixed-format all `true` |
| T-FIX-08 | Missing-evidence requirements exist and point at empty test rows | PASS | REQ-05 has no test evidence; `docs/test-results.md` T-03 and T-05 have no results |
| T-FIX-09 | All four evidence bases represented | PASS | directly documented, reasonable inference, missing evidence, conflicting evidence |
| T-FIX-10 | Duplicate file pair is byte-identical | PASS | identical sha256 for `docs/bill-of-materials.csv` and its copy |
| T-FIX-11 | CSV parses and holds missing/unusable values | PASS | 12 data rows, 11 with gaps, 8 columns |
| T-FIX-12 | Calibration JSON valid with an unknown date | PASS | one entry has `date: "unknown"` |
| T-FIX-13 | Media files carry valid format signatures | PASS | PNG 454 B, WAV 12,044 B |
| T-FIX-14 | CAD placeholder present and marked out of scope | PASS | `docs/rover-chassis.stl` |
| T-FIX-15 | No fixture modified since baseline | PASS | 20 files match `fixture-manifest.json` |
| T-FIX-16 | Every fixture path cited in the test documents exists | PASS | all cited paths resolve |

**Test-suite defects found and fixed during Stage 4** (the fixtures were correct; the
tests were wrong — see `change-log.md`):

- T-FIX-06 originally searched for the field-trial date in `design-revisions.md`,
  where it does not exist. Rewritten to name both source documents per conflict and
  to compare the extracted values rather than only test for their presence.
- T-FIX-06 originally extracted the temperature *requirement* (0.5) instead of the
  *measured* value (0.3). Corrected to `/Measured: plus or minus (0\.\d) degrees C/`.

---

## 2. Static Skill tests — actually executed

| ID | Test | Result | Evidence |
|---|---|---|---|
| T-SKILL-01 | `SKILL.md` exists at the expected path | PASS | `buildvault-skill/buildvault-project-intelligence/SKILL.md` |
| T-SKILL-02 | Directory name matches frontmatter name | PASS | `buildvault-project-intelligence` both |
| T-SKILL-03 | Capability evidence lines, one per CLI | PASS | 6 CLIs, each once |
| T-SKILL-04 | Every evidence CLI maps to the catalog's unique agent | PASS | all 6 correct against catalog v2.0.0 |
| T-SKILL-05 | Delegate targets are registered experts | PASS | `file-agent`, `document-agent`, `knowledge-agent`, `photo-agent` |
| T-SKILL-06 | Every delegate target has CLI evidence | PASS | 7 delegate commands, lines 52, 62, 66, 72, 74, 120, 126 |
| T-SKILL-07 | All delegate commands well formed | PASS | single-quoted, no placeholders, no apostrophes |
| T-SKILL-08 | All four required headings present | PASS | Goal, Required input, Workflow, Completion and failure |
| T-SKILL-09 | All five delegation states covered | PASS | `completed`, `failed`, `cancelled`, `waiting_user`, `waiting_approval` |
| T-SKILL-10 | No forbidden access/capability/bypass patterns | PASS | none |
| T-SKILL-11 | `cli.invoke` only in negated context | PASS | none outside negation |
| T-SKILL-12 | Skill states the local-validation limitation | PASS | disclaimer present |
| T-PROT-01 | Toolkit, Stage 1 audit, Stage 2 architecture unchanged | PASS | 12 files match their Stage 4 baseline hashes |

---

## 3. Behavioural tests — NOT TESTED: NAS runtime unavailable

For each test: the scenario, the fixtures, what the Skill *should* do, what was
*actually observed* (nothing — the Skill was not executed), the result, and a manual
evaluation checklist. **Instruction coverage** is static evidence that the Skill's
text addresses the scenario; it is **not** evidence of behaviour.

### T-A — Missing evidence

- **Fixtures:** `docs/requirements.md` (REQ-04, REQ-05, REQ-08), `docs/test-results.md` (T-03, T-05), `README.md`.
- **Expected:** REQ-05 marked not evidenced; no claim that it was achieved; the report names the evidence that would verify it; the requirement stays distinct from completed milestones.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 9 line 91 ("Not evidenced … never as proof that the work was not done") and the added line 94 (state what evidence would be needed). Addition made during Stage 4 — see `change-log.md` D-03.
- **Manual checklist:** (1) Does REQ-05 appear as *not evidenced*, not as planned or complete? (2) Is any completion claimed for PM2.5 sensing? (3) Does the report name the missing test or measurement needed? (4) Are REQ-01/03/06/07 (which have results) classified differently from REQ-05? (5) Does the manifest's coverage section list T-03 and T-05 as without results?

### T-B — Conflicting evidence

- **Fixtures:** `docs/conflicting-spec-summary.md` vs `docs/design-revisions.md`, `docs/progress-log.md`, `docs/test-results.md`; `docs/meeting-notes.md` (D-2) vs `README.md`.
- **Expected:** both source claims preserved; both source references shown; no silent winner; the report says what would resolve it; the manifest item marked conflicting evidence.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 9 line 92 and added line 94; "Evidence and honesty rules" line 151.
- **Manual checklist:** (1) Are battery, ingress, field-trial date, temperature accuracy and motor speed each shown with **both** values and **both** files? (2) Is any one value adopted as correct? (3) Does the report state what would resolve each conflict? (4) Is the D-2 vs `README.md` telemetry contradiction reported rather than reconciled? (5) Does the manifest mark these items *conflicting*, not *documented complete*?

### T-C — Empty and unusable files

- **Fixtures:** `docs/empty-notes.md` (0 bytes), `docs/untitled.md` (title only), `docs/noise-only-notes.txt`, `notes/ambiguous-notes.txt`.
- **Expected:** these files reported as insufficient; no findings manufactured; the rest of the project still analysed; coverage limits reported.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 3 line 58 (analysis status: empty / not analysed / failed); Step 4 line 62 ("If a document cannot be read, report it as a failure. If a document yields an empty result, say so and continue").
- **Manual checklist:** (1) Is `empty-notes.md` reported as empty rather than skipped silently? (2) Is `untitled.md` reported as no usable content? (3) Does the manifest still contain the findings from the useful documents? (4) Does the coverage section state that 2–4 files contributed nothing?

### T-D — Mixed file types

- **Fixtures:** `docs/*.md`, `docs/*.txt`, `docs/*.csv`, `docs/bill-of-materials-copy.csv`, `docs/rover-chassis.stl`, `data/*.csv`, `data/calibration.json`, `media/*.png`, `media/*.wav`.
- **Expected:** the right analysis path per format; every source reference preserved; unsupported formats reported as *not analysed*, never as analysed-with-nothing-found; discovery distinguished from successful extraction.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 3 line 58 (per-file analysis status, added in Stage 4); "Out of scope for this version" line 161 (CAD/STL interpretation excluded); Step 4 line 62.
- **Manual checklist:** (1) Is the STL file reported as *not analysed — format unsupported*? (2) Is it reported as analysed with no findings? (3) Are the two CSV files and the JSON parsed and cited by path? (4) Is the duplicate BOM reported as a duplicate rather than a second independent source? (5) Does the inventory separate "discovered" from "successfully analysed"?

### T-E — Partial extraction and coverage

- **Fixtures:** `docs/test-results.md` (T-07 ambiguous drift; T-01 duty cycle undefined; single-run tests), `docs/bill-of-materials.csv` (ATL-011 mass missing), `docs/design-revisions.md` (REV-C mass not recorded), `data/sensor-readings.csv` (11 rows with gaps).
- **Expected:** partial findings preserved; coverage and failure limits stated; no complete-history claim.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 4 line 62 (bounded `max-files`/`body-cap`, coverage and failure report); "Completion and failure" line 173 ("Never present partial coverage as a complete analysis").
- **Manual checklist:** (1) Is REQ-09 mass reported as incomplete, not as under 6 kg? (2) Is T-07's drift quoted without a unit interpretation? (3) Is the total mass left unknown rather than summed? (4) Does the report state that T-01/T-04 were single runs? (5) Are the CSV rows with missing cells excluded from any average, or is the gap stated?

### T-F — Ambiguous dates and timeline

- **Fixtures:** `docs/progress-log.md` ("March 14", "Late April", "Undated"), `data/sensor-readings.csv` (`05/06/2025 09:23`), `data/calibration.json` (`date: "unknown"`).
- **Expected:** only defensible chronology; ambiguous dates marked; no invented year or precise sequence; known dates separated from inferred ordering.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 8 line 82, extended in Stage 4 to require ambiguous/undetermined reporting.
- **Manual checklist:** (1) Is "March 14" reported without a year? (2) Is "Late April" reported without a day? (3) Is the undated waypoint entry listed as undetermined? (4) Is `05/06/2025` normalised only if stated as an interpretation? (5) Is the progress-log's out-of-order file order NOT used as chronology?

### T-G — Mixed evidence quality

- **Fixtures:** the whole set (documented / inferred / missing / conflicting all present).
- **Expected:** every important claim uses one of the four bases already in the Skill; no new classification scheme.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** "Evidence and honesty rules" lines 148–151; the four bases are exactly the Skill's four — no fifth category was introduced.
- **Manual checklist:** (1) Does every significant manifest entry carry one of the four bases? (2) Is any inference presented as documented? (3) Is any missing item stated as a negative fact about the work? (4) Does any entry use a basis outside the four?

### T-H — Scope drift

- **Fixtures:** `README.md` (v1 scope; telemetry and obstacle avoidance deferred), `docs/meeting-notes.md` (D-2 approves telemetry), `docs/engineering-change-request.md` (ECR-001 approved; ECR-002/003 proposed).
- **Expected:** later work compared against documented scope; drift identified; approved changes distinguished from unapproved suggestions; not every new idea called creep.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 11 line 102, extended in Stage 4 to separate approved changes from suggestions.
- **Manual checklist:** (1) Is telemetry reported as an *approved* scope expansion (D-2/ECR-001), not as creep? (2) Is obstacle avoidance reported as an *unapproved suggestion* (ECR-002), not as approved? (3) Is ECR-003 reported as an unapproved suggestion? (4) If the user supplies no objectives, is the assessment reported as unavailable? (5) Is any absent artifact reported as "not built"?

### T-I — Engineering knowledge extraction

- **Fixtures:** `docs/bill-of-materials.csv`, `docs/design-revisions.md`, `docs/test-results.md`, `docs/failure-log.md`, `docs/meeting-notes.md`, `data/calibration.json`.
- **Expected:** only supported details extracted; source references retained; unknown costs/specs marked missing; success never inferred from a proposal; a reported failure never turned into a verified root cause.
- **Actual observed:** nothing. Not executed.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 10 line 96 ("Record a value only when a source supports it"); "Evidence and honesty rules" line 153.
- **Manual checklist:** (1) Are PM2.5 costs/specs marked missing (ATL-008 is "not selected", 0 quantity)? (2) Is ATL-011's mass reported as missing? (3) Is the F-01 connector cause reported as *not confirmed*? (4) Is the F-03 cause reported as unknown? (5) Is F-02's power-loss cause reported as confirmed because the fixture says it was reproduced twice? (6) Is total cost reported as a sum of BOM lines with that basis stated?

### T-J — Approval boundary

- **Fixtures:** the whole set; workflow run up to report review.
- **Expected:** analysis and report composition happen; the report is presented for review; nothing is saved, moved, renamed, overwritten or deleted before explicit approval; report approval does not authorize organization; no deletion.
- **Actual observed:** nothing. Not executed. See `approval-boundary.md` for the boundary observations that *were* made statically.
- **Result:** **NOT TESTED — runtime unavailable.**
- **Instruction coverage (static):** Step 14 line 114 (review first, then per-action approval); Step 15 line 118; Step 16 line 124; "Approval and write boundaries" line 157.
- **Manual checklist:** (1) Does the run stop after presenting and wait? (2) Is any file written with no approval prompt? (3) If the user approves saving only, is organization still skipped? (4) Is any deletion attempted? (5) Does the saved report equal exactly the approved content? (6) Is a write reported using the expert's `verified` flag rather than as assumed success?

---

## 4. Tests not performed

| Test | Why not performed |
|---|---|
| T-A … T-J behaviour | No UGREEN NAS, no delegated experts, no `cli.invoke` access in this environment |
| Media delegation outcome (`photo-agent` `vision-ocr` / `vision-vlm`, `knowledge-agent` `audio-transcription`) | Same reason; the audit also records these as uncertain (album-index dependence, formats, prerequisites all `unknown`) |
| `ug-knowledge save-text` behaviour | Requires an approved write on a real NAS |
| `ug-filesystem` `mkdir` / `cpmv` behaviour | Requires an approved write on a real NAS |
| Static-check → upload / install / runtime compatibility | Not a claim the toolkit can make; `check-skill.mjs` `static-pass` proves none of these |

These are recorded as untested rather than passed. No local simulation was treated as
equivalent to delegated NAS execution.
