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

    buildInputsFrontend = with pkgs; [
      nodejs_latest
      nodePackages_latest.pnpm
      python3
    ];

  in rec {
    packages.${system} = rec {
      dev = pkgs.mkShell {
        buildInputs = buildInputsFrontend;
	shellHook = ''
          pnpm i
          pnpm build
        '';
      };

      default = dev;
    };
  };
}
