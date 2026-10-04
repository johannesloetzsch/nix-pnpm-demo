{
  description = "Example pnpm-nix-build";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs = { self, nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};

    nodejs = pkgs.nodejs_latest;
    pnpm = pkgs.nodePackages_latest.pnpm;

    # Playwright browsers pinned via nixpkgs. The nixpkgs revision dictates the
    # usable @playwright/test version: playwright-core hardcodes the browser
    # revision it expects, and the directory names below encode nixpkgs'
    # revision. The two must match or the browser is not found.
    playwrightDriver = pkgs.playwright-driver;
    playwrightBrowsers = playwrightDriver.browsers.override {
      # Playwright's own `devices["Desktop Chrome"]` has no `channel`, so
      # headless runs resolve chromium_headless_shell, not the full browser.
      # Dropping withChromium removes the unused full browser.
      # withChromiumHeadlessShell is a SEPARATE flag (defaults to true) - do
      # not assume dropping chromium drops the headless shell, it does not.
      withChromium = false;
      withFirefox = false;
      withWebkit = false;
    };

    nativeBuildInputs = [
      nodejs
      pnpm.configHook
    ];
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = nativeBuildInputs;
      shellHook = ''
        export PLAYWRIGHT_BROWSERS_PATH="${playwrightBrowsers}"
        export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

        # Nothing in a devshell creates node_modules: mkShell runs only
        # buildPhase, and pnpm.configHook is a postConfigureHook that would
        # also abort here because pnpmDeps is unset outside packages.default.
        # So install dependencies ourselves.
        #
        # The guard compares lockfile CONTENT, not mtime, because `git checkout`
        # preserves mtimes: an mtime guard silently keeps stale node_modules
        # across a branch switch. cmp costs one 31 KB read and makes an
        # unchanged lockfile a hard no-op, so re-entering the shell needs no
        # network at all.
        #
        # No --ignore-scripts: nixpkgs passes that for sandboxed derivation
        # builds, but postinstall scripts perform native builds here and
        # skipping them yields packages that fail at runtime, not at install.
        if [ ! -d node_modules ] || ! cmp -s pnpm-lock.yaml node_modules/.pnpm/lock.yaml; then
          pnpm install --frozen-lockfile
        fi
      '';
    };
    packages.${system} = rec {
      default = nix-pnpm-demo;
      nix-pnpm-demo = pkgs.stdenv.mkDerivation (finalAttrs: {
        pname = "nix-pnpm-demo";
        version = "0.1.0";
        src = ./.;
      
        pnpmDeps = pnpm.fetchDeps {
          inherit (finalAttrs) pname version src;
          # 3 = store is a reproducible tarball (nixpkgs >= 25.05 requires this)
          fetcherVersion = 3;
          hash = "sha256-dHtnhHLZgDhMeon5EgqzIND9rY0zK/758m1URnE9FqE=";
        };

	inherit nativeBuildInputs;

        buildPhase = ''
          runHook preBuild
            pnpm build
          runHook postBuild
        '';
      
        installPhase = ''
          mkdir -p $out
          cp -r apps/vite/dist/* $out/
        '';
      });
    };

    # Without a `checks` output, `nix flake check` only evaluates
    # packages.default, so it asserts nothing about type safety. This reuses
    # the package derivation so the check inherits its pnpmDeps closure.
    checks.${system}.typecheck = self.packages.${system}.default.overrideAttrs (old: {
      name = "nix-pnpm-demo-typecheck";
      doCheck = true;
      checkPhase = ''
        runHook preCheck
        pnpm typecheck
        runHook postCheck
      '';
    });

    templates.default = {
      path = ./.;
      description = "Vite + React + TS monorepo with Nix, pnpm, Turbo, shared configs (Biome, TS project refs)";
    };
  };
}
