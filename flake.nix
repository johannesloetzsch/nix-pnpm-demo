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
          hash = "sha256-74BDBFO+Ysfy25GA4oTljp60Hu7BRqjRgzT+JMA48DU=";
        };

	inherit nativeBuildInputs;

        buildPhase = ''
          runHook preBuild
            pnpm build
            #pnpm --filter=nix-pnpm-example-next build
          runHook postBuild
        '';
      
        installPhase = ''
          mkdir -p $out/next $out/vite
          cp -r apps/next/out/* $out/next/
          cp -r apps/vite/dist/* $out/vite/
        '';
      });

      default = nix-pnpm-example;
    };
  };
}
