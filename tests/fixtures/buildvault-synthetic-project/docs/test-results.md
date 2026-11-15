# Project Atlas — Test Results

> **SYNTHETIC TEST FIXTURE — FICTIONAL DATA.**

Each test states the requirement it addresses and the measured outcome. Where a test
was not completed, the row says so instead of giving a number.

## T-01 — Runtime on one charge — 2025-05-06

Requirement: minimum 8 h. Measured: 5 h 20 min under the documented duty cycle.
Outcome: not met. The duty cycle definition was not recorded with the result.
Related failure log entry F-03 covers the telemetry link during the same session.

## T-02 — Temperature sensor accuracy — 2025-05-06

Requirement: plus or minus 0.5 degrees C. Measured: plus or minus 0.3 degrees C over
20 to 30 degrees C against the reference thermometer.
Outcome: met.

## T-03 — Relative humidity accuracy — not run

Requirement: plus or minus 3 percent. No result was recorded. The test bench was not
available. Outcome: no evidence.

## T-04 — SD logging integrity — 2025-05-06

Requirement: 1 Hz logging with no lost records. Measured: 6 h at 1 Hz, 21,600 records,
zero lost. Outcome: met.

## T-05 — Ingress protection — not run

Requirement: IP54. The enclosure was changed in REV-C but no ingress retest was
performed. Outcome: no evidence.

## T-06 — Waypoint upload over cable — 2025-04-28

Requirement: upload waypoints from a laptop. Measured: 12 waypoint files uploaded
without error. Outcome: met.

## T-07 — Heading drift — 2025-06-01

A single line of output from an instrument was recorded:
`drift 3% over 50 m`
Whether the drift rate is per hour, per minute, or total over the run is not stated
anywhere in this fixture. The instrument was not identified.

## Coverage note

Tests T-03 and T-05 have no results. Test T-07 has a measurement whose units and
interpretation are ambiguous. Tests T-01 and T-04 were run one time each, with no
repeat runs recorded.
