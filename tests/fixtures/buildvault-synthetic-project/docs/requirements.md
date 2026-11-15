# Project Atlas — Requirements

> **SYNTHETIC TEST FIXTURE — FICTIONAL DATA.**

Requirements are listed with their verification status as documented in this file.
This file does not contain the test evidence itself; it only states the requirement
and where the requirement came from.

| ID | Requirement | Source of requirement | Documented verification |
|---|---|---|---|
| REQ-01 | Four independently driven wheels | README.md v1 scope | Design revision REV-A |
| REQ-02 | Minimum 8 h runtime on one charge | README.md v1 scope | Test T-01 (not met) |
| REQ-03 | Temperature accuracy within plus or minus 0.5 degrees C | README.md objective 1 | Test T-02 |
| REQ-04 | Relative humidity accuracy within plus or minus 3 percent | README.md objective 1 | Test T-03 (result missing) |
| REQ-05 | PM2.5 particulate sensing | README.md deferred list | No test evidence located |
| REQ-06 | Waypoint upload over cable | README.md v1 scope | Test T-06 |
| REQ-07 | SD logging at 1 Hz with no lost records | README.md v1 scope | Test T-04 |
| REQ-08 | Ingress protection rated IP54 | README.md v1 scope | Test T-05 (result missing) |
| REQ-09 | Total vehicle mass under 6 kg | README.md v1 scope | Bill of materials (incomplete) |
| REQ-10 | Live telemetry | README.md deferred list | Meeting decision D-2 (approved for v1) |

Notes on the status column above:

- REQ-04 points at a test identifier for which no result exists anywhere in this
  fixture. The requirement has no supporting measurement.
- REQ-05 has no test evidence at all. No document in this fixture claims it was built
  or tested.
- REQ-08 points at a test identifier with no result.
- REQ-09 depends on a bill of materials that is missing a mass value for one item.
