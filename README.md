# nix-pnpm-demo

## [Nix](https://nixos.org/) + [pnpm](https://pnpm.io/) + [Turbo](https://turbo.build/) + ([Astro](https://astro.build/)/[Vite](https://vite.dev/)/[Next](https://nextjs.org/)) + ([Typescript](https://www.typescriptlang.org/) + [React](https://react.dev/))

<img alt="nix" src="https://avatars.githubusercontent.com/u/487568" style="height: 50px; max-width: 100px; vertical-align: middle"/> + <img alt="pnpm" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Pnpm_logo.svg" style="height: 50px; max-width: 100px; vertical-align: middle"/> + <img alt="turbo" src="https://user-images.githubusercontent.com/4060187/196936104-5797972c-ab10-4834-bd61-0d1e5f442c9c.png" style="height: 50px; max-width: 100px; vertical-align: middle"/> + (<img alt="astro" src="https://astro.build/assets/press/astro-icon-dark.svg" style="height: 50px; max-width: 100px; vertical-align: middle"/>/<img alt="vite" src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Vitejs-logo.svg" style="height: 50px; max-width: 100px; vertical-align: middle"/>/<img alt="next" src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Nextjs-logo.svg" style="height: 50px; max-width: 100px; vertical-align: middle"/>) + (<img alt="typescript" src="https://upload.wikimedia.org/wikipedia/commons/6/67/TypeScript_Logo.svg" style="height: 50px; max-width: 100px; vertical-align: middle"/> + <img alt="react" src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" style="height: 50px; max-width: 100px; vertical-align: middle"/>)


## Usage

### Nix build

```bash
nix build
```

This will create a reproducible build of all web-apps in this repo.
You find the result in the directory `./result`.


### Nix develop

```bash
nix develop
configurePhase

pnpm build

cd apps/astro; pnpm dev
```

You can use `nix develop` and run the `configurePhase` function to get a reproducible development environment (including nodejs-dependencies).

Inside this shell pnpm can be used in the usual way. To build just a single app (`pnpm build`) or run the dev-tools (`pnpm dev`) of a specifc app inside of the turbo-repo, change to the directory of the app first (in the example `cd apps/astro`).


### Update

The file `flake.nix` contains a hash over all pnpm-dependencies.

```nix
pnpmDeps = pnpm.fetchDeps {
  [...]
  hash = "sha256-[...]";
};
```

Whenever a nodejs-package is added or it's version changed (in `package.json` or `pnpm-lock.yaml`), the hash needs be updated.


## Features

### [Nix](https://nixos.org/)
* **reproducible** builds
### [pnpm](https://pnpm.io/)
* fast, disk space **efficient** workspaces in **monorepos**
### [Turbo](https://turbo.build/)
* optimized build system with **caching**

### Alternative frontend frameworks
#### [Astro](https://astro.build/)
* **content-driven** websites with **markdown** support
#### [Vite](https://vite.dev/)
* **fast**
#### [Next](https://nextjs.org/)
* client and **server rendering**

### [Typescript](https://www.typescriptlang.org/)
* JavaScript with (optional or strict) **types**
### [React](https://react.dev/)
* reusable user interfaces from **components**


## Demo

An [Online Demo](https://johannesloetzsch.github.io/nix-pnpm-demo/astro/README/) is provided via CI/CD.
