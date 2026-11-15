# Project Atlas — Failure and Troubleshooting Log

> **SYNTHETIC TEST FIXTURE — FICTIONAL DATA.**

Each entry records what was observed and what was done. Where the cause was not
confirmed, the entry says so. No entry in this file contains a confirmed root cause
analysis for the telemetry or wheel faults.

## F-01 — 2025-04-05 — Right front wheel stopped

Observed: the right front wheel stopped turning while reversing on the bench. The
motor was warm to the touch. No motor temperature measurement was taken.
Action: the wheel connector was reseated and the wheel worked afterwards.
Cause: not confirmed. A loose connector is a possibility, not a verified cause.
No replacement part was fitted and no current measurement was recorded.

## F-02 — 2025-04-28 — SD card corruption after power loss

Observed: the SD card held an unreadable directory after the battery was pulled during
a logging run. The file system could not be mounted on the first attempt.
Action: the card was reformatted and a graceful shutdown sequence was added to the
firmware. No further corruption was reported afterwards.
Cause: power loss during a write, confirmed by reproducing the failure twice.
Resolution: graceful shutdown sequence, firmware change recorded against REV-C.

## F-03 — 2025-05-06 — Telemetry link dropped during field trial

Observed: the telemetry link dropped twice during the public field trial, once after
about 20 minutes and once after about 35 minutes.
Action: the rover continued logging locally and the link recovered on its own both
times.
Cause: unknown. Antenna orientation and radio interference were both suggested but
neither was tested. No packet capture was taken.
Impact: live monitoring of the field trial was interrupted; local logging was not
affected.
