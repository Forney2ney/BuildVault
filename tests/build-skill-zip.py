# BuildVault Stage 5 — Initial Skill Package ZIP builder.
#
# Packages ONLY the submitted Skill. The package must contain SKILL.md and, where
# genuinely used, Markdown references directly linked from it. Nothing else:
# no test runners, fixtures, toolkit source, audit or architecture documents,
# manifests, scripts, binaries, credentials or personal data.
#
# Uses only Python's standard library.
#
# Usage:  python tests/build-skill-zip.py
# Output: proposal/round-1-skill-package.zip

import hashlib
import sys
import zipfile
from pathlib import Path

ROOT = Path(r"C:\Users\User\Projects\BuildVault")
SKILL_DIR = ROOT / "buildvault-skill" / "buildvault-project-intelligence"
TARGET = ROOT / "proposal" / "buildvault-initial-skill-package.zip"

SKILL_FOLDER_NAME = "buildvault-project-intelligence"   # matches frontmatter name

MAX_ZIP_BYTES = 10 * 1024 * 1024       # compressed archive limit
MAX_UNCOMPRESSED_BYTES = 10 * 1024 * 1024
MAX_FILE_BYTES = 1024 * 1024           # 1 MB per file
MAX_FILE_COUNT = 100

ALLOWED_TOP = {"SKILL.md", "references"}
ALLOWED_EXTENSIONS = {".md"}

problems = []

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

# ---- collect source files, enforcing the package rules ----------------------
files = []
for path in sorted(SKILL_DIR.rglob("*")):
    if path.is_dir():
        continue
    rel = path.relative_to(SKILL_DIR).as_posix()
    parts = rel.split("/")

    if len(parts) == 1 and parts[0] == "SKILL.md":
        files.append((rel, path))
        continue
    if parts[0] == "references" and path.suffix == ".md":
        files.append((rel, path))
        continue

    problems.append("source file is not allowed in the Skill package: %s" % rel)

if not any(rel == "SKILL.md" for rel, _ in files):
    problems.append("no SKILL.md found in the Skill directory")

if len(files) > MAX_FILE_COUNT:
    problems.append("package has %d files, limit is %d" % (len(files), MAX_FILE_COUNT))

for rel, path in files:
    size = path.stat().st_size
    if size > MAX_FILE_BYTES:
        problems.append("%s is %d bytes, over the 1 MB per-file limit" % (rel, size))
    if path.suffix not in ALLOWED_EXTENSIONS:
        problems.append("%s is not a Markdown file" % rel)

uncompressed_total = sum(path.stat().st_size for _, path in files)
if uncompressed_total > MAX_UNCOMPRESSED_BYTES:
    problems.append("uncompressed package is %d bytes, over the 10 MB limit" % uncompressed_total)

if TARGET.exists():
    TARGET.unlink()

# ---- build the archive: one top-level folder named after the Skill ----------
with zipfile.ZipFile(TARGET, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for rel, path in files:
        arcname = "%s/%s" % (SKILL_FOLDER_NAME, rel)
        zf.write(path, arcname)

raw = TARGET.read_bytes()
size = len(raw)
digest = sha256(raw)

print("ZIP path:            %s" % TARGET)
print("Compressed size:     %d bytes (%.1f KB), limit %d KB" % (size, size / 1024, MAX_ZIP_BYTES // 1024))
print("Uncompressed total:  %d bytes (%.1f KB), limit %d KB" % (uncompressed_total, uncompressed_total / 1024, MAX_UNCOMPRESSED_BYTES // 1024))
print("SHA-256:             %s" % digest)
print("Entries:             %d of max %d" % (len(files), MAX_FILE_COUNT))
with zipfile.ZipFile(TARGET) as zf:
    bad = zf.testzip()
    if bad is not None:
        problems.append("corrupt ZIP entry: %s" % bad)
    largest = 0
    for info in zf.infolist():
        largest = max(largest, info.file_size)
        print("  %-58s %8d bytes (stored %d)" % (info.filename, info.file_size, info.compress_size))
    if largest > MAX_FILE_BYTES:
        problems.append("a ZIP entry is %d bytes, over the 1 MB limit" % largest)

if size > MAX_ZIP_BYTES:
    problems.append("ZIP exceeds the 10 MB limit")

print()
if problems:
    print("FAIL:")
    for p in problems:
        print("  - %s" % p)
    sys.exit(1)
print("PASS: package contains only permitted files and is within every size and count limit.")
