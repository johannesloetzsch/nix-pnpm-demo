#!/usr/bin/env node
// Guard: no tracked source may reference the pre-move `doc/` directory.
//
// The docs corpus moved from `doc/` to `docs/pages/` and `docs/issues/`. A
// reference to `doc/ci.md` is silently wrong now: it renders as prose, resolves
// to nothing on GitHub, and - because a link check only inspects rendered
// markdown - is invisible to `apps/e2e`. Two such references shipped in the
// `styles.css` of both docs packages, which are bundled into the app.
//
// Only paths that are exactly `doc/<something>` match. `docs/pages/ci.md` does
// not, because the character after `doc/` is a letter, not a slash.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const TEXT_EXTENSIONS =
  /\.(md|mdx|ts|tsx|js|jsx|mjs|cjs|css|json|nix|yml|yaml)$/;

// `doc/` not followed by `s`, i.e. the singular directory that no longer exists.
const STALE_PATH = /\bdoc\/(?!s\b)[a-z]/;

// This file quotes the stale path in its own comments, to explain what it looks
// for, so it would always match itself. Excluded: a stale path written into
// these comments would go unnoticed, which is the trade for a guard that can
// actually pass. Any real usage of the path lives in a scanned file.
const SELF = "scripts/check-links.mjs";

const files = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\0")
  .filter(
    (file) => file.length > 0 && file !== SELF && TEXT_EXTENSIONS.test(file),
  );

const offenders = [];

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((line, index) => {
    if (!STALE_PATH.test(line)) {
      return;
    }

    // The match position proves the hit is `doc/x`, not `docs/x`: the character
    // after `doc/` is neither `s` nor a slash.
    const at = line.search(STALE_PATH);

    offenders.push({
      file,
      line: index + 1,
      column: at + 1,
      text: line.trim(),
    });
  });
}

if (offenders.length === 0) {
  console.log(
    `check:links - no stale doc/ references in ${files.length} tracked files`,
  );
  process.exit(0);
}

console.error(
  `check:links - ${offenders.length} reference(s) to the pre-move doc/ directory:\n`,
);

for (const { file, line, column, text } of offenders) {
  console.error(`  ${file}:${line}:${column}`);
  console.error(`    ${text}`);
}

console.error(
  "\nThe docs corpus lives in docs/pages/ (rendered) and docs/issues/ (records).",
);
process.exit(1);
