{
  description = "Example pnpm-nix-build";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { self, nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};

    nodejs = pkgs.nodejs_latest;
    pnpm = pkgs.nodePackages_latest.pnpm;
      
    nativeBuildInputs = [
      nodejs
      pnpm.configHook
    ];
  in {
    packages.${system} = rec {
      default = nix-pnpm-demo;
      nix-pnpm-demo = pkgs.stdenv.mkDerivation (finalAttrs: {
        pname = "nix-pnpm-demo";
        version = "0.1.0";
        src = ./.;
      
        pnpmDeps = pnpm.fetchDeps {
          inherit (finalAttrs) pname version src;
          hash = "sha256-oLF7IZr0I3+3xZaEx69X7F9Ysf7LauVJrB9Vl075EdI=";
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
