# BuildVault Stage 5 — proposal DOCX builder.
#
# Converts proposal/round-1-proposal.md into a simple, readable DOCX using
# python-docx (already installed). The DOCX is an intermediate; Word then
# exports it to PDF. No third-party package is installed for this task.
#
# Usage:  python tests/make-proposal-docx.py
# Output: proposal/round-1-proposal.docx   (temporary intermediate)

import re
import sys
from pathlib import Path

try:
    from docx import Document
    from docx.shared import Pt, Inches, RGBColor
except ImportError as exc:  # pragma: no cover
    sys.stderr.write("python-docx is not available: %s\n" % exc)
    sys.exit(2)

ROOT = Path(r"C:\Users\User\Projects\BuildVault")
SOURCE = ROOT / "proposal" / "buildvault-project-proposal.md"
TARGET = ROOT / "proposal" / "buildvault-project-proposal.docx"

doc = Document()

# Page and base typography.
for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)

normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(10.5)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.08

ACCENT = RGBColor(0x1F, 0x3B, 0x63)


def add_title(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(17)
    run.font.color.rgb = ACCENT
    p.paragraph_format.space_after = Pt(2)


def add_subtitle(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    p.paragraph_format.space_after = Pt(10)


def add_heading(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = ACCENT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)


def add_body(text):
    p = doc.add_paragraph()
    add_inline(p, text)
    p.paragraph_format.space_after = Pt(7)


def add_inline(paragraph, text):
    """Render the small amount of inline Markdown used in the source."""
    for chunk in re.split(r"(`[^`]+`|\*\*[^*]+\*\*)", text):
        if not chunk:
            continue
        if chunk.startswith("`") and chunk.endswith("`"):
            run = paragraph.add_run(chunk[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(9.5)
        elif chunk.startswith("**") and chunk.endswith("**"):
            paragraph.add_run(chunk[2:-2]).bold = True
        else:
            paragraph.add_run(chunk)


lines = SOURCE.read_text(encoding="utf-8").splitlines()
for line in lines:
    stripped = line.strip()
    if not stripped:
        continue
    if stripped.startswith("# "):
        add_title(stripped[2:].strip())
    elif stripped.startswith("## "):
        add_heading(stripped[3:].strip())
    else:
        add_body(stripped)

doc.save(str(TARGET))
print("wrote %s (%d bytes)" % (TARGET, TARGET.stat().st_size))
