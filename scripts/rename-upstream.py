#!/usr/bin/env python3
"""Apply JStack's renames to upstream pstack text.

  scripts/rename-upstream.py <path>...             rewrite files in place
  scripts/rename-upstream.py --patch < in > out    rewrite an upstream diff

Paths, code spans and link targets get `jstack`; Markdown prose gets
`JStack`. Whole words only, so "upstack" is untouched. The persona names
poteto-mode, poteto-agent and poteto-help become j-mode, j-agent and j-help.
Lines that credit upstream (they link to github.com/cursor/plugins or name
Lauren Tan) are left as written.
"""
import os
import re
import sys

MARKDOWN = (".md", ".mdc")
WORD = re.compile(r"\bpstack\b")
CODE_OR_LINK = re.compile(r"`[^`]*`|\]\([^)]*\)")
PERSONA = [
    (r"\bpoteto-(mode|agent|help)\b", r"j-\1"),
    (r"\bPoteto (Mode|mode|subagent|help)\b", r"J \1"),
    (r"\bpoteto's agent style", "James's agent style"),
    (r"\bUse for poteto, ", "Use for "),
    (r"\bis my style\b", "is James's style"),
    (r"\bpoteto/", "j/"),
]


def rename(line, markdown):
    if "github.com/cursor/plugins" in line or "Lauren Tan" in line:
        return line
    for pattern, replacement in PERSONA:
        line = re.sub(pattern, replacement, line)
    line = re.sub(r"\bpstack(?=/|-models)", "jstack", line)
    if not markdown:
        return WORD.sub("jstack", line)
    line = CODE_OR_LINK.sub(lambda m: WORD.sub("jstack", m.group(0)), line)
    return WORD.sub("JStack", line)


def rename_patch():
    markdown = False
    for line in sys.stdin:
        if line.startswith("diff --git "):
            markdown = line.rstrip().endswith(MARKDOWN)
        sys.stdout.write(rename(line, markdown))


def rename_files(roots):
    for root in roots:
        for folder, dirs, names in os.walk(root):
            dirs[:] = [d for d in dirs if d not in (".git", "node_modules")]
            for name in names:
                path = os.path.join(folder, name)
                try:
                    with open(path, encoding="utf-8") as f:
                        text = f.read()
                except UnicodeDecodeError:
                    continue
                markdown = path.endswith(MARKDOWN)
                new = "".join(rename(l, markdown) for l in text.splitlines(keepends=True))
                if new != text:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new)
                    print(path)


if __name__ == "__main__":
    if sys.argv[1:] == ["--patch"]:
        rename_patch()
    elif sys.argv[1:]:
        rename_files(sys.argv[1:])
    else:
        sys.exit(__doc__)
