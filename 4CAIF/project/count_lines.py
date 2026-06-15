#!/usr/bin/env python3
"""
Zählt Code-Zeilen (ohne Kommentare und Leerzeilen) in .js, .ts, .html und .css Dateien.
"""

import os
import re
import sys
from pathlib import Path


SKIP_DIRS = {"node_modules", ".git", "dist", "__pycache__"}


def strip_js_comments(source: str) -> list[str]:
    """Entfernt // und /* */ Kommentare aus JS/TS."""
    # Entfernt mehrzeilige Kommentare /* ... */
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.DOTALL)
    lines = []
    for line in source.splitlines():
        # Entfernt einzeilige Kommentare //
        line = re.sub(r"//.*", "", line)
        if line.strip():
            lines.append(line)
    return lines


def strip_css_comments(source: str) -> list[str]:
    """Entfernt /* */ Kommentare aus CSS."""
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.DOTALL)
    return [line for line in source.splitlines() if line.strip()]


def strip_html_comments(source: str) -> list[str]:
    """Entfernt <!-- --> Kommentare aus HTML."""
    source = re.sub(r"<!--.*?-->", "", source, flags=re.DOTALL)
    return [line for line in source.splitlines() if line.strip()]


HANDLERS = {
    ".js":   strip_js_comments,
    ".ts":   strip_js_comments,
    ".css":  strip_css_comments,
    ".html": strip_html_comments,
    ".htm":  strip_html_comments,
}


def count_file(path: Path) -> int:
    handler = HANDLERS.get(path.suffix.lower())
    if handler is None:
        return 0
    try:
        source = path.read_text(encoding="utf-8", errors="ignore")
        return len(handler(source))
    except OSError as e:
        print(f"  [Fehler] {path}: {e}", file=sys.stderr)
        return 0


def scan(root: Path) -> dict[str, dict]:
    totals: dict[str, dict] = {}   # ext -> {files, lines}

    for dirpath, dirnames, filenames in os.walk(root):
        # Überspringe irrelevante Verzeichnisse
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for name in filenames:
            path = Path(dirpath) / name
            ext = path.suffix.lower()
            if ext not in HANDLERS:
                continue

            lines = count_file(path)
            if ext not in totals:
                totals[ext] = {"files": 0, "lines": 0}
            totals[ext]["files"] += 1
            totals[ext]["lines"] += lines
            print(f"  {str(path.relative_to(root)):<55} {lines:>5} Zeilen")

    return totals


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    root = root.resolve()

    if not root.is_dir():
        print(f"Fehler: '{root}' ist kein Verzeichnis.")
        sys.exit(1)

    print(f"\nZähle Code-Zeilen (ohne Kommentare) in: {root}\n")
    print("-" * 70)

    totals = scan(root)

    print("-" * 70)
    print(f"\n{'Typ':<10} {'Dateien':>8} {'Zeilen':>10}")
    print("-" * 30)

    grand_files = grand_lines = 0
    for ext in sorted(totals):
        d = totals[ext]
        print(f"{ext:<10} {d['files']:>8} {d['lines']:>10}")
        grand_files += d["files"]
        grand_lines += d["lines"]

    print("-" * 30)
    print(f"{'GESAMT':<10} {grand_files:>8} {grand_lines:>10}\n")


if __name__ == "__main__":
    main()
