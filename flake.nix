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
      nix-pnpm-example = pkgs.stdenv.mkDerivation (finalAttrs: {
        pname = "nix-pnpm-example";
        version = "0.1.0";
        src = ./.;
      
        pnpmDeps = pnpm.fetchDeps {
          inherit (finalAttrs) pname version src;
          hash = "sha256-v4tzpGsLPRQMJB3M0d01VqQcvykj+VUvuliGHnp7tOo=";
        };

	inherit nativeBuildInputs;

        buildPhase = ''
          runHook preBuild
            pnpm build
            #pnpm --filter=nix-pnpm-example-next build
          runHook postBuild
        '';
      
        installPhase = ''
          mkdir -p $out/next
          cp -r apps/next/out/* $out/next/
        '';
      });

      default = nix-pnpm-example;
    };
  };
}
