# Testing

End-to-end tests use [Playwright](https://playwright.dev/) and live in
`apps/e2e`.

## Running them

```bash
nix develop
pnpm test:e2e
```

That is the whole setup. Playwright starts the Vite dev server itself and waits
for it, so there is nothing to start by hand.

| Command | What it does |
| --- | --- |
| `pnpm test:e2e` | Run Playwright directly |
| `pnpm test` | Run the tests through Turborepo |
| `pnpm test:e2e:report` | Open the HTML report |

> [!NOTE]
> Use the devshell. Outside `nix develop` there is no `PLAYWRIGHT_BROWSERS_PATH`
> and no browser, so the tests fail with an unhelpful "executable doesn't exist"
> error rather than a clear one.

## Browsers come from Nix, not a download

`flake.nix` points Playwright at the browsers in the Nix store:

```bash
export PLAYWRIGHT_BROWSERS_PATH="${playwrightBrowsers}"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

Nothing is fetched at install time or run time. The closure is trimmed to
Chromium's headless shell and ffmpeg.

## The version lockstep

> [!WARNING]
> Bumping the flake's nixpkgs input **will** break the end-to-end tests unless
> `@playwright/test` is re-pinned to match.

The reason is that nixpkgs is the source of truth for the Playwright version:

- nixpkgs builds `playwright-driver` at a pinned version and names its browser
  directories by the revision it ships — for example
  `chromium_headless_shell-1194/chrome-linux/headless_shell`.
- `playwright-core` hardcodes the browser revision it expects for its own
  version.

If the two disagree, Playwright reports the browser as missing. So
`@playwright/test` is pinned to an **exact** version equal to
`pkgs.playwright-driver.version`.

| nixpkgs | `playwright-driver` | chromium revision | required `@playwright/test` |
| --- | --- | --- | --- |
| nixos-25.05 | 1.52.0 | 1169 | 1.52.0 |
| nixos-25.11 | 1.56.1 | 1194 | 1.56.1 |

You can check the pair before spending build time:

```bash
nix eval --raw github:NixOS/nixpkgs/nixos-25.11#playwright-driver.version
```

Then compare it against `apps/e2e/package.json`. Use an explicit nixpkgs
reference — a bare `nixpkgs#` resolves to unstable and will disagree.

## Configuration

`apps/e2e/playwright.config.ts` starts the dev server and waits on a URL that
must match the Vite `base` path:

```ts
const baseURL = "http://localhost:5173/nix-pnpm-demo/";
```

`reuseExistingServer` is on outside CI, so a dev server you already have running
is reused instead of causing a port conflict.

## When a failing run appears to hang

With `reporter: "html"`, Playwright serves the report on port 9323 after a
failure and does not exit. A red run looks like a hang until you interrupt it.

Playwright does not do this when `CI` is set. It is not a hung test run.

## What to run next

[Continuous integration](./ci.md) for what runs on every push, or
[Working offline](./offline.md) for when you have no network.
