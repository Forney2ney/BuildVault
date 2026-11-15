# BuildVault Stage 5 — proposal PDF verification.
# Verifies that proposal/buildvault-project-proposal.pdf is a real, readable PDF whose
# text content matches the source Markdown, without installing any package.
# Uses only Python's standard library (zlib for FlateDecode streams).

import re
import sys
import zlib
from pathlib import Path

PDF = Path(r"C:\Users\User\Projects\BuildVault\proposal\buildvault-project-proposal.pdf")
SOURCE = Path(r"C:\Users\User\Projects\BuildVault\proposal\buildvault-project-proposal.md")

problems = []

raw = PDF.read_bytes()
if not raw.startswith(b"%PDF-"):
    problems.append("missing %PDF- header")
if b"%%EOF" not in raw[-2048:]:
    problems.append("missing %%EOF trailer")

size = len(raw)
if size > 1024 * 1024:
    problems.append("PDF exceeds the 1 MB Limit (%.1f KB)" % (size / 1024))

# Page count from /Type /Page objects (excluding /Pages).
pages = len(re.findall(rb"/Type\s*/Page[^s]", raw))
if pages < 1:
    problems.append("no page objects found")

# Decompress every FlateDecode stream and pull out the text-showing operators.
texts = []
for match in re.finditer(rb"stream\r?\n(.*?)endstream", raw, re.S):
    blob = match.group(1)
    try:
        texts.append(zlib.decompress(blob))
    except zlib.error:
        continue

extracted = []
for blob in texts:
    # Word emits text as TJ arrays split at glyph-kerning points, so adjacent
    # literal strings must be concatenated with NO separator to rebuild words.
    parts = []
    for m in re.finditer(rb"\((?:\\.|[^\\()])*\)", blob):
        s = m.group(0)[1:-1]
        s = re.sub(rb"\\([()\\])", rb"\1", s)
        s = re.sub(rb"\\[0-7]{1,3}", b"", s)
        parts.append(s.decode("latin-1"))
    for m in re.finditer(rb"<([0-9A-Fa-f\s]+)>", blob):
        hexed = re.sub(rb"\s", b"", m.group(1))
        if len(hexed) % 2:
            continue
        try:
            parts.append(bytes.fromhex(hexed.decode("ascii")).decode("latin-1"))
        except ValueError:
            pass
    extracted.append("".join(parts))

joined = " ".join(p for p in extracted if p.strip())
normalized = re.sub(r"\s+", " ", joined).strip()

# Phrases that must survive into the PDF.
required = [
    "BuildVault",
    "Engineering Project Intelligence",
    "Next 15-Minute Action",
    "scope-drift",
    "ug-filesystem",
    "ug-knowledge",
    "save-text",
    "not-evidenced",
    "static-pass",
    "60 of 60",
    "file-workflow",
    "OpenCode",
    "CAD or STL",
    "Round 1 Project Proposal",
]
for phrase in required:
    if phrase.lower() not in normalized.lower():
        problems.append("phrase not found in PDF text: %r" % phrase)

if len(normalized) < 2000:
    problems.append("extracted text looks too short (%d chars)" % len(normalized))

print("PDF path:        %s" % PDF)
print("PDF size:        %d bytes (%.1f KB), limit 1024 KB" % (size, size / 1024))
print("Page objects:    %d" % pages)
print("Flate streams:   %d decompressed" % len(texts))
print("Extracted chars: %d" % len(normalized))
print("Source words:    %d" % len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]*", SOURCE.read_text(encoding='utf-8'))))
print()
if problems:
    print("FAIL:")
    for p in problems:
        print("  - %s" % p)
    sys.exit(1)
print("PASS: readable PDF, all required phrases present, size within limit.")
