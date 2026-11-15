# Expected Manifest Findings — Answer Key

This is the **expected** result of running the Analyze Project workflow against
`tests/fixtures/buildvault-synthetic-project`. It is a rubric for a later runtime
test, not a record of something that ran. Nothing here was produced by the Skill.

Legend: **[D]** directly documented · **[I]** reasonable inference · **[M]** missing
evidence · **[C]** conflicting evidence.

## 1. Identity and objectives

| Item | Expected basis | Value / note |
|---|---|---|
| Project name | **[D]** | Atlas Rover — Autonomous Environmental Monitoring Rover |
| Author | **[D]** | A. Rivera, Atlas Rover Team (fictional) |
| Proposal date | **[D]** | 2025-03-10 |
| Funding target | **[D]** | under 4,500 credits |
| Objective 1 | **[D]** | temperature and humidity at 1 min intervals |
| Objective 2 | **[D]** | autonomous 1 km route, return to dock |
| Objective 3 | **[D]** | SD-card logging |
| Objective 4 | **[D]** | cable waypoint upload |
| Objective 5 | **[D]** | survive light rain and dust |

## 2. Disciplines and subsystems

Expected subsystems: chassis, drive, power, sensing, storage, compute, enclosure.
Basis **[D]** from BOM `category` values. Discipline assignment itself is **[I]**.

## 3. File inventory

20 files discovered. Expected analysis status per file:

| Status | Files |
|---|---|
| analysed | all `docs/*.md`, `data/*.csv`, `data/calibration.json`, `README.md` |
| duplicate | `docs/bill-of-materials-copy.csv` — byte-identical to `docs/bill-of-materials.csv` |
| not analysed — format unsupported | `docs/rover-chassis.stl` |
| empty | `docs/empty-notes.md` |
| no usable content | `docs/untitled.md`, `docs/noise-only-notes.txt` |
| media — no usable evidence | `media/chassis-photo.png`, `media/field-trial-audio.wav` (degradable; report as no media evidence, never invent) |

## 4. Timeline

| Date | Event | Basis |
|---|---|---|
| 2025-03-10 | proposal written | **[D]** `README.md` |
| 2025-03-14 | chassis parts ordered, assembly started; design REV-A | **[C]** "March 14" has no year; REV-A is dated 2025-03-14 |
| 2025-04-02 | first bench drive test | **[D]** `docs/progress-log.md` |
| 2025-04-05 | F-01 right front wheel stopped | **[D]** `docs/failure-log.md` |
| 2025-04-17 | sensor board integrated (written `2025/04/17`) | **[D]** |
| 2025-04-20 | REV-B battery change | **[D]** `docs/design-revisions.md` |
| "Late April" | battery pack delivered | **[M]** no day; position vs 2025-04-17 undetermined |
| 2025-04-28 | F-02 SD corruption; T-06 waypoint upload | **[D]** |
| 2025-05-06 | field trial held; T-01, T-02, T-04; F-03; D-1, D-2; ECR-001 | **[C]** date conflicts with `docs/conflicting-spec-summary.md` (2025-05-13) |
| 2025-05-10 | ECR-002 proposed | **[D]** |
| 2025-05-14 | ECR-003 proposed | **[D]** |
| 2025-05-19 | meeting; D-4, D-5 | **[D]** |
| 2025-05-22 | REV-C motor controller and battery | **[D]** |
| 2025-06-01 | firmware v0.9; T-07 | **[D]** |
| undated | waypoint upload tool finished | **[M]** undated; file order is not chronology |

Required timeline properties: no year invented for "March 14"; "Late April" left
without a day; the undated entry left undetermined; `05/06/2025` normalisation stated
as an interpretation if applied.

## 5. Milestones

| Milestone | Expected class | Basis |
|---|---|---|
| REQ-01 four driven wheels | Documented complete | **[D]** REV-A + T-01 movement? — expected: **[D]** via REV-A |
| REQ-02 8 h runtime | Documented in progress — tested, **not met** (5 h 20 min) | **[D]** T-01 |
| REQ-03 temperature ±0.5 C | Documented complete | **[D]** T-02 (±0.3 C) |
| REQ-04 humidity ±3 % | **Not evidenced** | **[M]** T-03 has no result |
| REQ-05 PM2.5 sensing | **Not evidenced** | **[M]** no document claims it was built or tested; deferred in `README.md` |
| REQ-06 waypoint upload | Documented complete | **[D]** T-06 |
| REQ-07 SD logging 1 Hz | Documented complete | **[D]** T-04 |
| REQ-08 IP54 ingress | **Conflicting evidence** | **[C]** design-revisions IP54 vs compiled summary IP65; T-05 has no result |
| REQ-09 mass under 6 kg | Documented in progress — mass unknown | **[D]** REV-B 5.8 kg, REV-C no mass, ATL-011 mass missing |
| REQ-10 live telemetry | Documented complete (approved for v1) | **[D]** D-2 / ECR-001 approved; contradicts `README.md` |

Milestone-class caveat: REQ-01's expected evidence is REV-A (design), not a test. A
correct manifest must not claim REQ-01 was *verified in test* — only that a design
revision documents the configuration.

## 6. Decisions and revisions

| Item | Expected basis | Note |
|---|---|---|
| REV-A / REV-B / REV-C | **[D]** | dates and contents as recorded |
| Battery capacity current value | **[C]** | REV-C 5200 mAh vs compiled summary 6400 mAh |
| Battery voltage | **[C]** | 14.4 V vs 14.8 V |
| Motor speed | **[C]** | 60 rpm vs 90 rpm |
| Current total mass | **[M]** | no document states a current total |
| Telemetry approved for v1 | **[D]** | D-2 + ECR-001 |
| Conflict resolution | **[M]** | D-4 records that nobody could say which figure is correct |

## 7. Components, materials, costs

| Item | Expected basis | Note |
|---|---|---|
| BOM line items | **[D]** | 12 lines, quantities and unit costs as in CSV |
| Total cost | **[D]** with stated basis | sum of BOM lines; basis must say it is a BOM rollup |
| ATL-008 PM2.5 sensor | **[M]** | "not selected", quantity 0 — not a cost or a fitted part |
| ATL-011 mass | **[M]** | "mass not recorded" |
| Duplicate BOM | **[D]** | counted once, not twice |

## 8. Specifications

Expected: motor 12 V 60 rpm **[C]**, battery 5200 mAh 14.4 V **[C]**, enclosure IP54
**[C]**, SD 32 GB **[D]**, compute quad-core 4 GB **[D]**.

## 9. Testing and measured results

| Test | Expected basis | Note |
|---|---|---|
| T-01 5 h 20 min vs 8 h | **[D]** | not met; duty cycle definition not recorded |
| T-02 ±0.3 C | **[D]** | met; **[C]** against compiled summary |
| T-03 | **[M]** | no result |
| T-04 21,600 records, zero lost | **[D]** | single run |
| T-05 | **[M]** | no result; enclosure changed after REV-C |
| T-06 | **[D]** | met |
| T-07 drift | **[D]** value, **[M]** meaning | `3% over 50 m`; unit and period not stated |

## 10. Problems, failures, resolutions

| Entry | Expected basis | Note |
|---|---|---|
| F-01 cause | **[M]** | "not confirmed"; must not become "loose connector" |
| F-01 resolution | **[D]** | connector reseated, wheel worked afterwards |
| F-02 cause | **[D]** | power loss during write, reproduced twice — fixture states confirmed |
| F-02 resolution | **[D]** | graceful shutdown in firmware, tied to REV-C |
| F-03 cause | **[M]** | unknown; antenna and interference suggested, neither tested |
| F-03 impact | **[D]** | live monitoring interrupted, local logging unaffected |

## 11. Lessons learned

Expected lessons, each with a source:

- Power loss during SD writes corrupts the file system; graceful shutdown prevents it
  — **[D]** F-02.
- Conflicting compiled summaries are a real risk when the author does not re-check
  sources — **[D]** `docs/conflicting-spec-summary.md` author note + D-4.
- Single-run tests cannot support a reliability claim — **[D]** T-01/T-04 coverage note.
- An undated entry is not evidence of when work happened — **[M]** progress log.

## 12. Scope drift

| Item | Expected finding |
|---|---|
| Live telemetry in v1 | **Approved scope expansion** — D-2 + ECR-001 approved 2025-05-06 |
| Obstacle detection in v1 | **Unapproved suggestion** — ECR-002 proposed, reviewed twice, still unapproved |
| Solar top-up panel | **Unapproved suggestion** — ECR-003 proposed, no review |
| PM2.5 sensing | **Not evidenced** — deferred in `README.md`; must not be called creep |
| Site count (2 vs 3) | **[C]** — `notes/ambiguous-notes.txt` vs `docs/requirements.md` scope |
| Battery warmer | **[M]** — open question at proposal time, still unevaluated |
| If no objectives supplied | Assessment reported **unavailable**, not manufactured |

## 13. Open questions

- What is the current total mass? (no document states one) **[M]**
- Which battery capacity is correct: 5200 mAh or 6400 mAh? **[C]**
- Which ingress rating is correct: IP54 or IP65? **[C]**
- Was the field trial on 2025-05-06 or 2025-05-13? **[C]**
- When was chassis assembly actually started (missing year)? **[M]**
- How many prototype sites (2 or 3)? **[C]**
- What is the heading drift rate really (`3% over 50 m`)? **[M]**
- What caused the telemetry dropouts? **[M]**

## 14. Next 15-Minute Action — expected shape

Not a single correct answer, but it must: be one specific action; be startable in
15 minutes; cite its evidence; and name the gap it closes. A correct example:

> Weigh the rover on a calibrated scale and record the total mass, because REQ-09
> cannot be assessed and no document states a current mass (REV-C recorded none,
> ATL-011 mass missing) **[M]**.

Incorrect examples: "review the project", "improve reliability", or any action that
depends on resolving a conflict without first asking which document is authoritative.

## 15. Report readiness

The final report must be composable from sections 1–14 above, carry a source
reference on every technical claim, and include a coverage statement listing: 2 files
with no usable content, 1 unsupported format, 2 media files with no usable evidence,
2 tests without results, 5 conflicting values, and 3 undetermined or ambiguous dates.
