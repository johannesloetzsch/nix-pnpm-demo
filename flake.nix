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
          hash = "sha256-08icnQNaOFpyEJcPc7fXcDCvpem4FBwmzR9e/GZ4DrU=";
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

    templates.default = {
      path = ./.;
      description = "Vite + React + TS monorepo with Nix, pnpm, Turbo, shared configs (Biome, TS project refs)";
    };
  };
}
