# Continuous integration

The workflow lives in `.github/workflows/deploy.yml` and has two jobs: `verify`
gates the branch, and `deploy` publishes the app to GitHub Pages.

## The verify job

Steps run in this order, and the order matters:

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm typecheck
- run: pnpm build
- run: pnpm lint
- run: pnpm test
```

### Install comes first, and is explicit

CI does not enter the devshell, so nothing installs dependencies for it. The
explicit step is what makes a failure attributable: without it, the first task
that needs `node_modules` — `pnpm typecheck` — fails, and the error points at
type-checking instead of at installing.

> [!NOTE]
> This is not hypothetical. CI failed exactly that way before the step was
> added.

`typescript` lives only in `apps/vite` and `apps/e2e`, so `tsc` resolves from
`node_modules/.bin`. Any dependency-related change should be verified in a
clean worktree rather than a warm one:

```bash
git worktree add /tmp/ci-sim
cd /tmp/ci-sim && nix develop --command pnpm typecheck
```

## The deploy job

On `main`, the build output is uploaded to GitHub Pages. The artifact is the
contents of `./result`, which `nix build` produces.

### Three things must agree

> [!WARNING]
> The base path is set in three places. Changing one without the others breaks
> the site in a way that is easy to misdiagnose.

1. `base` in `apps/vite/vite.config.ts`
2. `baseURL` in `apps/e2e/playwright.config.ts`
3. The Pages settings for the repository

The Vite `base` must be the repository path:

```ts
base: "/nix-pnpm-demo/"
```

The Playwright `baseURL` must include the same path, because that is where the
dev server serves the app:

```ts
const baseURL = "http://localhost:5173/nix-pnpm-demo/";
```

Pages serves the repository at `/nix-pnpm-demo/`, and the build is uploaded
from `./result` — so `base` is that path and not a deeper one.

### Why hash routing

The docs browser uses hash routing (`/#/nix`) rather than path routing. GitHub
Pages does not rewrite unknown paths to `index.html`, so a path-routed deep link
returns a 404 on refresh. Hash routing needs no `404.html` fallback.

## Running the same checks locally

```bash
pnpm typecheck
pnpm build
pnpm lint
nix build
nix develop --command pnpm test:e2e
```

## What to run next

[Working offline](./offline.md) for the network rules, or
[Adopting this template](./adopting.md) to make it yours.
