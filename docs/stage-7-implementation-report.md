# Stage 7 — Implementation Report

What was built, what was tested, what remains untested. Prepared 11 November 2026.

## 1. What was built

### 1.1 Development Skill candidate

`buildvault-skill-dev/buildvault-project-intelligence/SKILL.md` — 22,279 bytes, 207 body
lines, 8 delegate commands.

Expanded from the Stage 5 Skill (8 delegations it now has; Stage 5 had 7). New content:

- **Step 7 — plan-only organization proposal.** Uses `file-workflow start` (effect `read`,
  approval `none`) so a plan can be produced without any side effect, executed only in
  Step 20 after separate approval.
- **Step 10 — revision relationship assessment.** Claims a revision link only where a
  document states one.
- **Step 11 — milestone dependencies and blocked work.** Blocking items and their
  sources are required; computed completion percentages are forbidden.
- **Step 12 — engineering decision register and test-results register.** Two new
  manifest sections; failure causes recorded as confirmed only when a source confirms.
- **Step 14 — readiness assessment.** Counts only, with an explicit list of what it
  cannot establish.
- **Step 15 — richer recommendations.** Reason, priority, dependencies, evidence needed,
  documentation to close the gap, risk if skipped; documented-fact actions separated from
  general engineering suggestions.
- **Step 16 — handoff brief** as a first-class step.
- **Evidence bases extended from four to five** by adding "unsupported or inaccessible
  material", per the Stage 7 requirement.

Unchanged from Stage 5: all six CLI→expert evidence lines, the delegation restrictions,
the five statuses, the approval boundaries, the out-of-scope list, and the disclosure.

Official 0.7.3 checker on the dev candidate: `static-pass`, **0 errors, 0 warnings**.

### 1.2 Local simulation harness

`tests/sim/simulate.mjs` — reads the real synthetic fixtures and derives inventory,
evidence ledger, timeline, milestones, scope findings, readiness, recommendations,
registers, BOM rollup, report and handoff brief. Node built-ins only.

`tests/sim/mock-experts.mjs` — simulated expert responses. Every evidence item carries a
verbatim `sourceQuote` that the harness verifies against the actual fixture text, so a
simulated fact cannot drift from the evidence.

`tests/sim/run-sim-tests.mjs` — 31 orchestration and simulation checks.

`tests/sim/generate-demo-artifacts.mjs` — writes the report and handoff brief.

### 1.3 HTML demonstration

`demo/buildvault-simulation-dashboard.html` — 56,748 bytes, 9 views: overview, inventory,
timeline, manifest, milestones and blockers, conflicts and gaps, scope drift,
recommendations, report and handoff. A persistent banner states that it is a local
simulation, not a UGREEN NAS interface, and that no expert has run. Simulated
provenance is labelled on every evidence row.

## 2. What can actually be demonstrated locally

| Demonstrable | How | Evidence |
|---|---|---|
| Full file inventory with per-file analysis status | `tests/sim/output/simulation-result.json` | SIM-02, SIM-03, SIM-04 |
| Duplicate grouping | same | SIM-05 |
| 28-event timeline from fixture text | same | SIM-09 |
| 5 deliberately ambiguous dates left ambiguous | same | SIM-08 |
| 10 milestone classifications across all 5 classes | same | SIM-11 |
| 6 conflicting values, both readings and both sources | same | SIM-06, SIM-07 |
| 4 missing-evidence gaps with the verification evidence named | same | SIM-12 |
| Scope drift: approved vs unapproved | same | SIM-13 |
| Readiness with counts and 4 explicit non-claims, no score | same | SIM-14 |
| 5 prioritized recommendations, one Next 15-Minute Action | same | SIM-15, SIM-16 |
| Decision register (5) and test register (7) | same | SIM-18, SIM-19 |
| BOM rollup of 12 lines, 932 credits, incompleteness marked | same | SIM-17 |
| Engineering report and handoff brief as text | `tests/sim/output/*.md` | artifacts written |
| All five delegation statuses behave as specified | `tests/sim/run-sim-tests.mjs` | ORCH-01…ORCH-05 |

**Not demonstrable locally:** any UGREEN expert execution, any `cli.invoke`, any NAS file
write, any real `ug-document` extraction, any real `ug-photo` vision or `ug-knowledge`
transcription.

## 3. Test results

| Suite | Result | Notes |
|---|---|---|
| Stage 4 suite (`tests/run-tests.mjs`) | **29/29 passed** | Unchanged; fixtures and runner untouched |
| Stage 7 suite (`tests/sim/run-sim-tests.mjs`) | **31/31 passed** | ORCH-01…10 and SIM-01…21 |
| Official checker, Stage 5 Skill | `static-pass`, 0/0 | Unchanged |
| Official checker, dev Skill (working) | `static-pass`, 0/0 | — |
| Official checker, dev Skill (extracted ZIP) | `static-pass`, 0/0 | — |
| Simulated-quote verification | **0 problems** | 24 quotes verified verbatim against fixture text |
| Simulated media handling | no invented evidence | SIM-20 |

### Testing status of every new behaviour

| Test class | Count | Status |
|---|---|---|
| Executed and passed | 31 | ORCH and SIM checks above |
| Executed and failed | 0 | — |
| Only statically checked | 3 | Plan-only organization proposal (Step 7) needs a NAS to return a plan; the dev Skill's text was verified statically; `ug-document writing` gateway gating; ZIP limits |
| Not executed (NAS runtime required) | 9 items | See `docs/capability-audit.md` and `tests/test-cases.md` section 4 |

## 4. Defects found and corrected during Stage 7

| # | Defect | Fix |
|---|---|---|
| 1 | `simulate.mjs` `walk()` shadowed the imported `readdirSync`, causing infinite recursion | Removed the local binding; import the real function |
| 2 | Two mock quotes did not appear verbatim because the fixture text wraps across lines | Corrected both quotes to true substrings; quote verification now 0 problems |
| 3 | Hand-rolled ZIP writer produced a corrupt central directory | Rebuilt with Python `zipfile`; archive now extracts and passes the checker |
| 4 | Stage 5 baseline JSON written with a UTF-8 BOM by PowerShell | Stripped the BOM on read; integrity verified independently against the Stage 5 hashes |
| 5 | An initial compliance grep tested for the *existence* of a negated `cli.invoke` mention rather than that all mentions are negated | Re-checked directly: the term does not appear at all, which is stronger |

## 5. Deliberately deferred

Cross-project knowledge reuse, CAD/STL interpretation, dynamic scheduling, continuous
monitoring, snapshot archives, and percentage-completion scoring. Each is documented in
`docs/stage-7-feature-matrix.md` as future work rather than approximated.

## 6. Protected files

All 8 Stage 5 protected files verified unchanged by hash at the end of this stage. The
toolkit, the Stage 1 audit, the Stage 2 architecture, the Stage 4 fixtures, the Stage 4
runner, and the Stage 4 expectations were not modified.
