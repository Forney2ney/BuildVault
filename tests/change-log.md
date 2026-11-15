# Stage 4 Change Log

Two kinds of change were made: corrections to the **Skill** (found by reviewing it
against the required test scenarios) and corrections to the **test suite** (the tests
were wrong, not the fixtures). Both are listed, because a test-suite fix is not a
Skill fix.

## 1. Changes to the Skill

Five changes, each the smallest correction that closes a gap between the Skill and a
required test scenario. Architecture (Stage 2) and the capability audit (Stage 1) are
unchanged; every delegation mapping, safety rule and approval boundary is preserved.
The official checker was re-run after every change.

| ID | Defect | Why it matters | Change | Scenarios closed |
|---|---|---|---|---|
| D-01 | Step 3 carried file metadata forward but never recorded an **analysis status** per file, so a file whose format the experts cannot read (STL) could be reported the same way as a file that was read and found to contain nothing. | "No findings" and "not analysed" are different answers. Reporting them identically is exactly the failure mode that would let an unsupported format silently look like an empty project. | Added one sentence to Step 3: record `analysed`, `not analysed because the format is unsupported`, `empty`, or `failed` for every file. | T-D |
| D-02 | Step 8 separated *confirmed* from *inferred* dates but had **no instruction for a date that is ambiguous** — missing a year, unclear format, or an event whose position cannot be established. | An ambiguous date is the one case where a model is most likely to invent a year or force an ordering. The rule existed for gaps in general but not for ambiguous dates specifically. | Added one sentence to Step 8: report such dates as ambiguous or undetermined; never supply the missing year or impose an unsupported sequence. | T-F |
| D-03 | Step 9 required recording *not evidenced* and *conflicting* items but never required saying **what would close the gap or resolve the conflict**. | Without this, the manifest lists unknowns but gives the user no way to act on them, and the Next 15-Minute Action has nothing to cite. | Added one sentence to Step 9: state the evidence needed for each not-evidenced item, and the clarification or document needed to resolve each conflict. | T-A, T-B |
| D-04 | Step 11 compared observed work against stated objectives but never distinguished an **approved** scope change from an **unapproved** suggestion. | The fixture contains exactly this case: telemetry was approved (D-2/ECR-001) while obstacle avoidance remains a proposal (ECR-002). Without the distinction the Skill would either call approved work "creep" or call a proposal "approved". | Added one sentence to Step 11: approved changes are reported as approved expansion, proposals as suggestions, and only unapproved expansion as drift. | T-H |
| D-05 | Step 14 asked for "explicit approval before writing anything", which could be read as **one blanket approval** covering both saving a report and moving files. | Test J requires that approval for one action never authorizes another. A blanket prompt invites the most dangerous possible interpretation. | Reworded Step 14: ask for review first, then for approval; each write step needs its own explicit approval naming the specific action, content and destination; approval for one action is never approval for another. | T-J |

Verification after the Skill changes:

- Official checker: `static-pass`, **0 errors, 0 warnings**, exit code 0
  (sha256 `fd2443975e416e640232a4da10f3d7dafb2c829eb828f95032512be57d711de0`).
- `tests/run-tests.mjs`: **29/29 PASS**, exit code 0.
- No CLI name, Action name, agent mapping or parameter was added, changed or invented.
- No evidence requirement was weakened; every change adds a required disclosure.
- Body grew from 171 to 178 lines, far below the 500-line recommendation.

## 2. Changes to the test suite

These are defects in my tests, not in the Skill or the fixtures.

| ID | Defect | Why it matters | Change |
|---|---|---|---|
| TS-01 | T-FIX-06 searched for the field-trial date inside `docs/design-revisions.md`, where it does not exist, and failed. | A check that looks in the wrong file reports a fixture defect that does not exist, and would have masked a real one. | Rewrote the conflict check to name both source documents per conflict and to compare the **extracted values**, not merely test for their presence. |
| TS-02 | T-FIX-06 extracted the temperature **requirement** (0.5 C) instead of the **measured** value (0.3 C), so the evidence line described a conflict that is not the real one. | The reported evidence is the test's output; an inaccurate value undermines the whole record. | Anchored the extraction to `/Measured: plus or minus (0\.\d) degrees C/`. |
| TS-03 | The first runner version left `progress`/`tests` variables undefined after TS-01 and crashed. | A runner that cannot run proves nothing. | Routing all fixture reads through a cached `textAt()` helper. |

After TS-01…TS-03: **29/29 PASS, exit 0.**

## 3. Not changed

- `toolkit/` — untouched (12-file hash baseline: T-PROT-01).
- `docs/capability-audit.md` — untouched (Stage 1).
- `docs/architecture.md` — untouched (Stage 2). The five Skill corrections implement
  behaviour the architecture already described; none redefines it.
- The 11-section manifest structure — unchanged.
- The four evidence bases — unchanged; no fifth basis introduced.
- The capability evidence lines and all seven delegate commands — unchanged.
