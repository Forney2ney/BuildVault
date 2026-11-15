# BuildVault Stage 4 — Test Suite

Tests whether the BuildVault Skill can handle imperfect engineering evidence without
inventing facts, and whether it respects approval boundaries.

## What this suite can and cannot do

There are **four different kinds of evidence** in this directory. They are not
interchangeable and are recorded separately everywhere:

| Kind | What it proves | Status in this environment |
|---|---|---|
| **Static validation** | `SKILL.md` structure, delegation format, capability mappings, safety patterns | **Available** — official `toolkit/scripts/check-skill.mjs` plus `tests/run-tests.mjs` |
| **Fixture integrity tests** | The synthetic fixtures really contain the conditions each test needs (empty files, real conflicts, ambiguous dates) | **Available** — `tests/run-tests.mjs` |
| **Manual reasoning review** | The Skill's *instructions* cover each required behaviour; a checklist for a human reviewer | **Available** — `tests/test-cases.md` sections 2 and 4 |
| **Actual NAS runtime validation** | The delegated experts really ran and the manifest was really produced | **NOT AVAILABLE** — no NAS, no `cli.invoke` access, no delegated experts |

No test in this directory claims behavioural validation. Every behavioural case
(T-A … T-J) is recorded as **NOT TESTED — runtime unavailable**, with a manual
evaluation checklist so it can be run on a real NAS later. Nothing here simulates a
delegated expert, and nothing here writes to a project folder.

## Files

| File | Purpose |
|---|---|
| `README.md` | This file — how to run and interpret the suite |
| `fixture-inventory.md` | Every synthetic fixture file and the scenario it supports |
| `test-cases.md` | Test cases, expected behaviour, observed behaviour, result |
| `expected-results.md` | The answer key: expected manifest findings and uncertainty cases |
| `approval-boundary.md` | Approval-specific tests and observations |
| `change-log.md` | Stage 4 changes to the Skill and why |
| `fixture-manifest.json` | Baseline sha256 of the fixtures; detects accidental modification |
| `generate-media.mjs` | One-off generator for the two media files (Node built-ins only) |
| `run-tests.mjs` | The deterministic test runner |
| `fixtures/buildvault-synthetic-project/` | The synthetic project (fictional — see its `README.md`) |

## Running the suite

From the repository root:

```
node tests/run-tests.mjs
```

Expected output: one `PASS` or `FAIL` line per check, then a count. Exit code `0`
means every deterministic check passed. Exit code `1` means at least one failed.

The runner **never writes into `fixtures/`**. The one exception is
`--update-manifest`, which writes only `tests/fixture-manifest.json`:

```
node tests/run-tests.mjs --update-manifest   # re-baseline fixture hashes
```

Use it after deliberately changing a fixture, never to make a failing check pass.

Official static check (must be run separately — it validates the Skill, not fixtures):

```
node toolkit/scripts/check-skill.mjs buildvault-skill/buildvault-project-intelligence
```

## Interpreting results

- `PASS` with a detail string means the check actually inspected the thing.
- `FAIL` on T-FIX-15 means a fixture was modified after the baseline was recorded.
  Decide deliberately whether the fixture or the baseline is wrong, then act.
- `PASS` on T-SKILL-* means the Skill's *instructions* are structurally correct.
  It does **not** mean the Skill behaved correctly at runtime.
- A `PASS` on `node toolkit/scripts/check-skill.mjs` (`static-pass`) does **not**
  prove upload, installation, device compatibility, or that any NAS operation ran.

## Safety rules observed while building this suite

- The toolkit, `docs/capability-audit.md` and `docs/architecture.md` are never
  modified. `T-PROT-01` verifies this by hash on every run.
- All synthetic data lives under `tests/fixtures/`; all outputs live under `tests/`.
- No real user project, name, organization or measurement appears anywhere.
- No file is ever deleted, moved, renamed or overwritten by this suite.
- No NAS write operation is performed, and none is simulated.
