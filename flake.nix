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
      nix-pnpm-demo = pkgs.stdenv.mkDerivation (finalAttrs: {
        pname = "nix-pnpm-demo";
        version = "0.1.0";
        src = ./.;
      
        pnpmDeps = pnpm.fetchDeps {
          inherit (finalAttrs) pname version src;
          hash = "sha256-rkMy7SQuwxC39NDHXyKu7errTIt4+83igrb5rhkCgSM=";
        };

	inherit nativeBuildInputs;

        buildPhase = ''
          runHook preBuild
            pnpm build
            #pnpm --filter=nix-pnpm-demo-next build
          runHook postBuild
        '';
      
        installPhase = ''
          mkdir -p $out/next $out/vite $out/astro
          cp -r apps/next/out/* $out/next/
          cp -r apps/vite/dist/* $out/vite/
          cp -r apps/astro/dist/* $out/astro/
        '';
      });

      default = nix-pnpm-demo;
    };
  };
}
