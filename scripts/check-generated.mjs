#!/usr/bin/env node
/*
 * Guard: the committed generated pages must match what the generators produce.
 *
 * `src/generated/pages.ts` is committed because `pnpm typecheck` runs before
 * `pnpm build` and tsc has to resolve it. That makes drift possible: an author
 * edits a doc page, `tsc -b` succeeds against the *old* generated file, and the
 * stale HTML ships if nobody rebuilds.
 *
 * The generators are invoked directly with `node`, bypassing turbo on purpose.
 * A turbo cache hit replays logs without running the task, so comparing
 * afterwards would compare the file against itself and always pass. Running the
 * generator forces the real output, and `git diff --exit-code` then reports any
 * difference.
 *
 * Plain JavaScript, and no imports from the docs packages: this runs from the
 * repository root where those packages' dependencies are not necessarily
 * resolvable by bare specifier.
 */

import { execFileSync } from "node:child_process";

const GENERATORS = [
  "packages/example-docs-markdown-it/scripts/render-pages.mjs",
  "packages/example-docs-marked/scripts/render-pages.mjs",
];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    ...options,
  });
}

/**
 * `git diff --exit-code` signals differences with exit status 1, which makes
 * `execFileSync` throw. The diff is on the thrown error's `stdout`, so it has to
 * be read from there - letting the throw propagate would discard the only output
 * that matters and report a clean tree.
 */
function runDiff(args) {
  try {
    return run("git", args);
  } catch (error) {
    if (error.status === 1) {
      return error.stdout ?? "";
    }

    throw error;
  }
}

const GENERATED = [
  "packages/example-docs-markdown-it/src/generated/pages.ts",
  "packages/example-docs-marked/src/generated/pages.ts",
];

let regenerated = 0;

for (const generator of GENERATORS) {
  run("node", [generator]);
  regenerated += 1;
}

console.log(`check:generated - ran ${regenerated} generator(s)`);

// Scope the comparison to the generated files only. A blanket `git diff` would
// also report the styles.css edits this branch carries, which are intended work
// rather than drift, and would make the check fail for the wrong reason.
const diffOutput = runDiff([
  "diff",
  "--exit-code",
  "--stat",
  "--",
  ...GENERATED,
]);

if (diffOutput.trim().length > 0) {
  console.error("\ncheck:generated - generated files are out of date:\n");
  process.stderr.write(diffOutput);
  console.error(
    "\nRun `pnpm build` and commit the result. The generated file is committed on",
  );
  console.error(
    "purpose, so a stale copy is a real defect, not a local artefact.",
  );
  process.exit(1);
}

console.log("check:generated - committed pages match the generators");
