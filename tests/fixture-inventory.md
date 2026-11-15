# Fixture Inventory

Every file under `tests/fixtures/buildvault-synthetic-project/`. All content is
fictional. "Scenarios" refer to the tests in `tests/test-cases.md`.

| Fixture | Type | Content | Scenarios supported |
|---|---|---|---|
| `README.md` | MD | Initial proposal: objectives, original v1 scope, explicit deferred list, open questions | T-A, T-H, T-G, T-I |
| `docs/requirements.md` | MD | REQ-01…REQ-10 with the documented verification source for each; two requirements point at test rows with no result, one has no evidence at all | T-A, T-C, T-G |
| `docs/progress-log.md` | MD | Progress entries out of chronological order, with a year-less date, a day-less date, and one undated entry | T-F, T-B, T-G |
| `docs/design-revisions.md` | MD | REV-A/B/C: chassis, battery, motor controller, ingress rating, mass estimates (REV-C mass not recorded) | T-I, T-B, T-E, T-G |
| `docs/bill-of-materials.csv` | CSV | 12 line items with category, description, specification, quantity, unit cost; one item mass not recorded | T-I, T-E, T-D |
| `docs/bill-of-materials-copy.csv` | CSV | Byte-identical duplicate of the BOM | duplicate handling, T-D |
| `docs/test-results.md` | MD | T-01…T-07; T-03 and T-05 have no results, T-07 has an ambiguous measurement, coverage note | T-A, T-B, T-E, T-I, T-C |
| `docs/failure-log.md` | MD | F-01 (cause not confirmed), F-02 (cause confirmed), F-03 (cause unknown) | T-I, T-G |
| `docs/meeting-notes.md` | MD | Decisions D-1…D-5; D-2 approves telemetry and contradicts the proposal; D-5 leaves ECR-002 unapproved | T-B, T-H |
| `docs/engineering-change-request.md` | MD | ECR-001 approved, ECR-002 and ECR-003 proposed and unapproved | T-H, T-B |
| `docs/conflicting-spec-summary.md` | MD | Compiled summary whose author never re-checked sources; conflicts on battery, voltage, ingress, field-trial date, temperature accuracy, mass, motor speed | T-B, T-G |
| `docs/empty-notes.md` | MD | **Zero bytes** | T-C |
| `docs/untitled.md` | MD | A heading and nothing else | T-C |
| `docs/noise-only-notes.txt` | TXT | A file of textual noise with no usable engineering information | T-C, T-D |
| `docs/rover-chassis.stl` | STL | Placeholder explicitly marked out of scope; CAD/STL interpretation is not a capability | T-D, out of scope |
| `notes/ambiguous-notes.txt` | TXT | Incomplete and ambiguous notes: unverified impressions, unresolved site count, "about 5 kg" | T-C, T-E, T-G |
| `data/sensor-readings.csv` | CSV | 12 rows with empty cells, an `n/a` value, mixed units and a different date format | T-D, T-E, T-F |
| `data/calibration.json` | JSON | Three calibration entries; one has `date: unknown`, one is missing a field | T-D, T-F, T-E |
| `media/chassis-photo.png` | PNG | 16x16 generated placeholder image (Node built-ins, no dependencies) | media degradability |
| `media/field-trial-audio.wav` | WAV | 1.5 s generated mono tone (Node built-ins, no dependencies) | media degradability |

## Coverage matrix (fixture × primary requirement)

| | A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|---|
| `README.md` | ● | | | | | | ● | ● | ● | |
| `docs/requirements.md` | ● | | ● | | | | ● | | | |
| `docs/progress-log.md` | | ● | | ● | | ● | ● | | ● | |
| `docs/design-revisions.md` | | ● | | ● | ● | | ● | | ● | |
| `docs/bill-of-materials.csv` | | | | ● | ● | | ● | | ● | |
| `docs/test-results.md` | ● | ● | ● | ● | ● | | ● | | ● | |
| `docs/failure-log.md` | | | | | | | ● | | ● | |
| `docs/meeting-notes.md` | | ● | | | | | ● | ● | | |
| `docs/engineering-change-request.md` | | ● | | | | | ● | ● | | |
| `docs/conflicting-spec-summary.md` | | ● | | ● | | | ● | | | |
| `docs/empty-notes.md` | | | ● | ● | | | | | | |
| `docs/untitled.md` | | | ● | | | | | | | |
| `docs/noise-only-notes.txt` | | | ● | ● | | | | | | |
| `docs/rover-chassis.stl` | | | | ● | | | | | | |
| `notes/ambiguous-notes.txt` | | | ● | | ● | | ● | | | |
| `data/sensor-readings.csv` | | | | ● | ● | ● | ● | | | |
| `data/calibration.json` | | | | ● | ● | ● | ● | | | |
| `media/*` | | | | | | | | | | (degradable media path) |

A = missing evidence · B = conflicting evidence · C = empty/unusable · D = mixed
file types · E = partial extraction · F = ambiguous dates · G = mixed evidence
quality · H = scope drift · I = knowledge extraction · J = approval boundary.

## Media generation

The two media files were produced by `tests/generate-media.mjs` using only
`node:fs` and `node:zlib`. They are placeholders, not real recordings, so the only
correct outcome of a media delegation against them is an honest "no usable media
evidence" report. Run `node tests/generate-media.mjs` to regenerate them; the
fixture baseline then needs `--update-manifest`.
