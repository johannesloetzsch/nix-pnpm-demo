# Tooling

Two tools enforce quality here: **Biome** for linting and formatting, and
**Turborepo** for task orchestration. Both are configured centrally.

## Biome

Biome replaces ESLint and Prettier with a single fast tool and a single
configuration.

### Running it

```bash
pnpm lint
pnpm lint:fix
```

### Shared configuration

The configuration lives in `packages/biome-config/biome.json`. The root
`biome.json` extends it:

```json
{
  "extends": ["./packages/biome-config/biome.json"]
}
```

It is extended by path rather than by package name on purpose: no workspace
package declares `@repo/biome-config` as a dependency, so the bare specifier
cannot resolve.

That path form has one wrinkle. Biome scans the tree and finds the shared file
as a *nested* configuration, and a nested root is an error unless it opts out:

```json
{ "root": false }
```

Without that key you get `RootInRoot` — "Found a nested root configuration".

### Biome 2 schema

Biome 2 sets `additionalProperties: false`, so an unknown key is a hard error,
not a warning. The notable renames:

| Biome 1 | Biome 2 |
| --- | --- |
| `organizeImports` (top level) | `assist.actions.source.organizeImports` |
| `organizeImports.enabled: true` | `organizeImports: "on"` |
| `files.ignore` | `files.includes` with `!`-negated patterns |
| `linter.rules.recommended` | `linter.rules.preset: "recommended"` |

`javascript.formatter.quoteStyle` did **not** move.

### Running on NixOS

> [!NOTE]
> This override is what makes `pnpm lint` work at all on NixOS.

NixOS cannot execute `@biomejs/cli-linux-x64` — it is a generic-linux glibc
binary and fails with a `stub-ld` loader error. `pnpm-workspace.yaml` aliases
that package name to the musl build, which runs on both NixOS and glibc CI:

```yaml
overrides:
  "@biomejs/cli-linux-x64": "npm:@biomejs/cli-linux-x64-musl@2.5.15"
```

Two things make this fragile, and both are worth re-checking when Biome is
bumped:

- The version is an **exact** pin, not a range, because `@biomejs/biome` itself
  is exact-pinned in the root `package.json`. Move both together or the CLI
  version will disagree with the wrapper.
- The override lives in **`pnpm-workspace.yaml`, not `package.json`.** pnpm 10.28
  and later no longer read the `pnpm` field of `package.json` and ignore it
  silently. A `pnpm.overrides` block in `package.json` looks correct and does
  nothing.

## Turborepo

Turborepo runs each workspace's scripts in dependency order and caches the
results.

### The task graph

Tasks are declared in `turbo.json`. The graph is deliberately minimal — a task
depends on another only when it genuinely must.

### Strict mode filters the environment

> [!WARNING]
> A task only sees the environment variables listed in `env`, `globalEnv` or
> `passThroughEnv`.

This bites in practice. The devshell exports `PLAYWRIGHT_BROWSERS_PATH`, so
`pnpm test:e2e` works when Playwright is called directly. The same tests under
`pnpm test`, which goes through Turborepo, silently lose the variable — Playwright
falls back to `~/.cache/ms-playwright` and reports that the executable does not
exist.

The fix is to list it in `turbo.json`:

```json
"globalPassThroughEnv": ["PLAYWRIGHT_BROWSERS_PATH"]
```

Pass-through, not `globalEnv`, and the reason is deliberate: the value is a Nix
store path that changes on every nixpkgs bump. Hashing it as an environment
variable would invalidate **every** task, including `build`.

If a task behaves differently under Turborepo than when run directly, check this
first.

## What to run next

[Testing](./testing.md) for the end-to-end tests, or
[Nix](./nix.md) for the build and devshell.
