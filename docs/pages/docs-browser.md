# The docs browser

Two packages render this repository's markdown into a browsable site. Pick one, import one
component, and your markdown is a documentation site with a sidebar, a table of contents, and
working links between pages.

| Package | Parser | Add for |
| --- | --- | --- |
| `@repo/example-docs-markdown-it` | [`markdown-it`](https://github.com/markdown-it/markdown-it) | Content you control |
| `@repo/example-docs-marked` | [`marked`](https://github.com/markedjs/marked) | Content from users, or a smaller install |

Both render the same pages to the same HTML. The only difference is which parser runs at build
time, so choosing either one does not lock you in.

## Using it

Install one package, then render the component:

```bash
pnpm --filter your-app add @repo/example-docs-markdown-it
```

```tsx
import { DocsBrowser } from "@repo/example-docs-markdown-it";

export function App() {
  return <DocsBrowser />;
}
```

That renders the first page. The component takes two optional props:

| Prop | Type | Default |
| --- | --- | --- |
| `slug` | `string` | the first page |
| `onNavigate` | `(slug: string) => void` | none; links then navigate the URL themselves |

An unknown `slug` falls back to the first page rather than rendering nothing, so a stale link
shows the documentation instead of a blank screen.

### Routing

`onNavigate` is where your router goes. Without it, the component does not change the URL and
sidebar buttons do nothing beyond clicking. `apps/vite/src/App.tsx` keeps the current page in the
URL hash and passes it in:

```tsx
const [slug, setSlug] = useState(currentSlugFromHash());

<DocsBrowser slug={slug} onNavigate={setSlug} />;
```

Each package also exports `PAGES`, the generated list of pages, if you need the titles or slugs
for your own navigation.

## Where the pages come from

| Source | Becomes |
| --- | --- |
| `README.md` | the `overview` page |
| `docs/pages/<name>.md` | the `<name>` page |

Markdown becomes HTML **at build time**, by `scripts/render-pages.mjs` in each package, which
writes `src/generated/pages.ts`. Two consequences worth knowing:

- **The parser does not ship to the browser.** Parsing happens during `pnpm build`, so no
  markdown library is in the client bundle. This is the main reason to generate rather than
  parse in a component.
- **`src/generated/pages.ts` is committed.** `pnpm typecheck` runs before `pnpm build` and `tsc`
  needs the file to exist. Every build rewrites it.

Adding a page means one extra step: add its slug to the `NAV` array in **both**
`render-pages.mjs` files. It is listed there explicitly so the sidebar order is a decision rather
than whatever order the filesystem returns. A slug you forget is not an error — the page renders
nothing and no sidebar entry appears, so add the slug when you add the file.

## Linking between pages

Two link forms are tagged for in-app navigation, and both work:

```markdown
[Nix](./nix.md)                    <!-- from one page to a sibling -->
[Nix](./docs/pages/nix.md)         <!-- from the README frontpage -->
```

The reason for two is that the first resolves on GitHub and from inside `docs/pages/`, and the
second resolves from the repository root. The README links with the longer form because it sits
one level up.

The build tags a link with the target slug only when that slug is a real page, so a link to any
other file is left alone. The `href` is never rewritten, so the markdown still works when read
directly on GitHub — the same source is the GitHub README and the app's frontpage.

Both link forms were checked by a test, after 21 links shipped broken when the corpus moved from
`doc/` to `docs/pages/` and only one of the two forms was tagged.

## Heading ids and GitHub alerts

Two features come from a post-processing step in the generator rather than from either parser:

- **Heading ids** come from `github-slugger`, so both packages produce identical ids and the
  table of contents and `#fragment` links agree.
- **GitHub alerts** work: `> [!WARNING]` renders as a labelled callout in the app, and stays a
  quote block with the same label on GitHub.

## Markdown features that need a plugin

Neither parser supports the whole of GitHub's Markdown. Where one needs help, the generator
supplies it:

| Feature | `marked` | `markdown-it` |
| --- | --- | --- |
| Task lists (`- [x]`) | built in via `gfm: true` | `markdown-it-task-lists` |
| Heading anchors | — | `markdown-it-anchor` |
| Tables, strikethrough, autolinks | built in via `gfm: true` | built in |

This is the main thing to weigh when choosing a parser: `marked` covers more of GitHub's dialect
out of the box, while `markdown-it` reaches the same rendering through two small plugins. Check
the [CommonMark spec](https://spec.commonmark.org/) and GitHub's own documentation for anything
your own pages rely on before choosing.

## Choosing a parser

Install cost is the honest difference. Measured from the production dependency closures:

| | Direct dependencies | Production closure |
| --- | --- | --- |
| `markdown-it` | 4 | 13 |
| `marked` | 2 | 2 |

The extra entries are `markdown-it-anchor`, `markdown-it-task-lists`, and the `@types/*`
packages `markdown-it-anchor` pulls in as a peer. Neither parser is in the client bundle, so
bundle size is not the deciding factor.

The behavioural difference is HTML escaping. `markdown-it` escapes raw HTML in the markdown
source; `marked` passes it through. If your content is yours and may contain HTML, `marked` is
the more faithful option. If content can come from users, escaping is the safer default.

Rendering is otherwise identical: the end-to-end suite asserts equal HTML for every page and
equal heading ids across both packages.

## Removing it

The browser is optional, and the packages exist to demonstrate how a workspace package is wired
in. [Adopting this template](./adopting.md) has the full removal checklist.

## What to run next

[Adopting this template](./adopting.md) for the full removal checklist, or
[Project structure](./structure.md) for how the packages are wired in.
