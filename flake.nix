{
  description = "Example pnpm-nix-build";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { self, nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};
    inherit (pkgs) lib;

    pnpm = pkgs.nodePackages_latest.pnpm;

    buildInputsFrontend = with pkgs; [
      nodejs_latest
      pnpm
      python3
    ];

  in rec {
    packages.${system} = rec {
      dev = pkgs.mkShell {
        ## trivial build in a shell
 
        buildInputs = buildInputsFrontend;
	shellHook = ''
          pnpm i
          pnpm build
        '';
      };

      nix-pnpm-example = pkgs.stdenv.mkDerivation (finalAttrs: {
        pname = "nix-pnpm-example";
        version = "0.1.0";
      
        src = ./.;
      
        nativeBuildInputs = with pkgs; [
          nodejs_latest
          pnpm.configHook
        ];
      
        pnpmDeps = pnpm.fetchDeps {
          inherit (finalAttrs) pname version src;
          hash = "sha256-vHA3FqGqOeEBYpcroIv2FnT0mPuclKp0QGIg8HxjqSA=";
        };

	buildPhase = ''
          pnpm build
        '';

        installPhase = ''
          mkdir $out
          cp -r out/* $out/
        '';
      });

      default = nix-pnpm-example;
    };
  };
}
