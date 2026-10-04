/*
 * Renders README.md and docs/pages/*.md to HTML at build time and writes the result
 * to src/generated/pages.ts.
 *
 * Why a codegen step instead of parsing in the browser: `import.meta.glob`
 * inlines the markdown at build time, but calling the parser from a React
 * component parses it at runtime, which would ship the whole parser to every
 * visitor. Generating the HTML here keeps both the markdown and the parser out
 * of the client bundle.
 *
 * Plain JavaScript on purpose: the package's `build` script runs this with
 * `node`, so it must not depend on a TypeScript loader being available.
 *
 * The generated file is committed rather than gitignored, because `pnpm
 * typecheck` runs before `pnpm build` and tsc has to find the module. This file
 * is rewritten by every build, so it cannot drift in practice.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";
import MarkdownIt from "markdown-it";
import anchorModule from "markdown-it-anchor";
import taskLists from "markdown-it-task-lists";

// markdown-it-anchor has no `exports` map, so Node resolves its CommonJS build
// and the default export may be nested one level deeper than expected.
const anchor = anchorModule.default ?? anchorModule;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const outFile = join(here, "..", "src", "generated", "pages.ts");

/** Sidebar order. Mirrors mkdocs' explicit `nav:` list. */
const NAV = [
  "overview",
  "docs-browser",
  "getting-started",
  "structure",
  "tooling",
  "nix",
  "offline",
  "testing",
  "ci",
  "adopting",
];

const CALLOUT =
  /<blockquote>\s*<p>\[!(NOTE|WARNING|TIP|CAUTION|IMPORTANT)\]\s*([\s\S]*?)<\/p>([\s\S]*?)<\/blockquote>/g;

const CALLOUT_LABELS = {
  NOTE: "Note",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
  TIP: "Tip",
};

/**
 * Two rewrites neither library does natively:
 *
 * 1. GitHub alert syntax. `> [!WARNING]` is a GitHub extension, not
 *    CommonMark, so both parsers emit a plain blockquote. Rewriting it here
 *    means one source renders as a callout both in the app and on GitHub.
 * 2. Cross-document links. A link to another page is correct in the
 *    repository but dead in a single-page app, so it is tagged with the target
 *    slug and intercepted by the browser component. Two forms occur: sibling
 *    links between pages (`./nix.md`) and the table on the frontpage
 *    (`./docs/pages/nix.md`), both matched here. Only slugs that are real
 *    pages are tagged, so a link to some other file is left alone. The href
 *   itself is never rewritten, because it still has to resolve when the
 *   markdown is read directly on GitHub.
 *
 * 3. Task-list markup. `markdown-it-task-lists` adds `contains-task-list`,
 *    `task-list-item` and `task-list-item-checkbox` classes; marked emits the
 *    same inputs with no classes. Nothing in this repo styles them, so they are
 *    dropped to keep the rendered HTML byte-identical across implementations.
 *    The attribute order happens to match already.
 */
function enhance(html) {
  return html
    .replace(CALLOUT, (_match, kind, first, rest) => {
      const label = CALLOUT_LABELS[kind] ?? kind;
      const level = kind.toLowerCase();
      return (
        `<div class="docs-callout docs-callout--${level}" role="note">` +
        `<p class="docs-callout__label">${label}</p>` +
        `<p>${first}</p>${rest}</div>`
      );
    })
    .replace(/href="\.\/(?:docs\/pages\/)?([a-z0-9-]+)\.md"/g, (match, slug) =>
      NAV.includes(slug) ? `${match} data-doc-slug="${slug}"` : match,
    )
    .replaceAll(
      / class="(?:contains-task-list|task-list-item|task-list-item-checkbox)"/g,
      "",
    );
}

function sourceFor(slug) {
  return slug === "overview"
    ? join(repoRoot, "README.md")
    : join(repoRoot, "docs", "pages", `${slug}.md`);
}

const pages = [];

for (const slug of NAV) {
  const source = await readFile(sourceFor(slug), "utf8");
  const slugger = new GithubSlugger();
  const headings = [];

  // html: false is markdown-it's default, kept explicit: raw HTML in a doc page
  // is escaped rather than injected. linkify matches marked's GFM default of
  // autolinking bare URLs, so both implementations render a source identically.
  const md = new MarkdownIt({ html: false, linkify: true });

  // markdown-it has no task-list support in any preset, so GFM `- [x]` would
  // render as literal text while marked renders checkboxes. This plugin closes
  // that gap. Called with no options on purpose: `enabled: true` removes the
  // `disabled=""` attribute, and because that plugin builds the attribute by
  // string concatenation the space separator goes with it, emitting malformed
  // `<input class="..."type="checkbox">`. The default also matches marked, which
  // always emits `disabled=""`. See `enhance` for the remaining class difference.
  md.use(taskLists);

  md.use(anchor, {
    level: [2, 3],
    slugify: (text) => slugger.slug(text),
    callback: (token, info) => {
      headings.push({
        slug: info.slug,
        title: info.title,
        level: Number.parseInt(token.tag.slice(1), 10),
      });
    },
  });

  const heading = /^#\s+(.+)$/m.exec(source);

  pages.push({
    slug,
    title: (heading?.[1] ?? slug).trim(),
    html: enhance(md.render(source)),
    headings,
  });
}

const contents =
  `// Generated by scripts/render-pages.mjs - do not edit by hand.\n` +
  `// Regenerate with \`pnpm build\`. Sources: README.md and docs/pages/*.md.\n` +
  `import type { Page } from "../types";\n\n` +
  `export const PAGES: Page[] = ${JSON.stringify(pages, null, 2)};\n`;

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, contents);

console.log(`rendered ${pages.length} pages with markdown-it -> ${outFile}`);
