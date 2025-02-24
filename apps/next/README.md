This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

```bash
npx create-next-app@latest nix-pnpm-example --use-pnpm
```

The pnpm-nix-build is done [as documented](https://github.com/NixOS/nixpkgs/blob/master/doc/languages-frameworks/javascript.section.md#pnpm-javascript-pnpm).

## Build

```bash
nix build
```

or

```bash
nix develop
configurePhase
pnpm run build
```
