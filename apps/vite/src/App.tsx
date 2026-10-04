import { DocsBrowser as DocsBrowserMarkdownIt } from "@repo/example-docs-markdown-it";
import { DocsBrowser as DocsBrowserMarked } from "@repo/example-docs-marked";
import { useEffect, useState } from "react";
import "./App.css";

const VARIANTS = ["markdown-it", "marked"] as const;

type Variant = (typeof VARIANTS)[number];

const FACTS: Record<Variant, string> = {
  "markdown-it":
    "MIT · 13 packages in the production closure · escapes raw HTML",
  marked:
    "MIT · 2 packages in the production closure · passes raw HTML through",
};

type Route = { variant: Variant | null; slug: string };

function parseHash(): Route {
  const [variant, slug] = window.location.hash.replace(/^#\/?/, "").split("/");
  const known = VARIANTS.includes(variant as Variant);
  return {
    variant: known ? (variant as Variant) : null,
    slug: slug || "overview",
  };
}

function Chooser({
  onPick,
}: {
  onPick: (variant: Variant, slug: string) => void;
}) {
  return (
    <main className="chooser">
      <p className="chooser__eyebrow">Technical proof of concept</p>
      <h1 className="chooser__title">nix-pnpm-demo</h1>
      <p className="chooser__lede">
        A Vite + React + TypeScript monorepo template with reproducible Nix
        environments, pnpm workspaces, Turborepo orchestration, centralised
        Biome and TypeScript configs, and TypeScript project references. Shared
        packages are types-only unless a runtime build is genuinely needed.
      </p>
      <pre className="chooser__code">
        <code>
          nix flake init -t github:johannesloetzsch/nix-pnpm-demo{"\n"}cd
          nix-pnpm-demo{"\n"}nix develop{"\n"}pnpm dev
        </code>
      </pre>
      <p className="chooser__extract">
        What you are looking at is a component the template ships: a{" "}
        <code>&lt;DocsBrowser /&gt;</code> that turns markdown files into a site
        with a sidebar, a table of contents and working links between pages.
        Pick a parser below to read the documentation. The markdown is rendered
        at build time, so no parser is shipped to the browser.
      </p>
      <ul className="chooser__cards">
        {VARIANTS.map((variant) => (
          <li key={variant}>
            <button
              type="button"
              className="chooser__card"
              onClick={() => onPick(variant, "overview")}
            >
              <span className="chooser__card-name">{variant}</span>
              <span className="chooser__card-facts">{FACTS[variant]}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="chooser__hint">
        Both packages are kept on purpose so you can compare the two parsers.
        This is a proof of concept for wiring a workspace package into the
        template, not a finished docs system.
      </p>
    </main>
  );
}

function VariantSwitcher({
  current,
  slug,
  onPick,
}: {
  current: Variant;
  slug: string;
  onPick: (variant: Variant, slug: string) => void;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: role=group is the ARIA pattern for a set of related controls; fieldset is for form inputs
    <div className="switcher" role="group" aria-label="Markdown renderer">
      {VARIANTS.map((variant) => (
        <button
          key={variant}
          type="button"
          className="switcher__button"
          aria-pressed={variant === current}
          onClick={() => onPick(variant, slug)}
        >
          {variant}
        </button>
      ))}
      <button
        type="button"
        className="switcher__button switcher__button--muted"
        onClick={() => {
          window.location.hash = "/";
        }}
      >
        compare
      </button>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const go = (variant: Variant, slug: string) => {
    window.location.hash = `/${variant}/${slug}`;
  };

  const { variant, slug } = route;

  if (!variant) {
    return <Chooser onPick={go} />;
  }

  const Docs =
    variant === "markdown-it" ? DocsBrowserMarkdownIt : DocsBrowserMarked;

  return (
    <>
      <Docs slug={slug} onNavigate={(next) => go(variant, next)} />
      <VariantSwitcher current={variant} slug={slug} onPick={go} />
    </>
  );
}

export default App;
