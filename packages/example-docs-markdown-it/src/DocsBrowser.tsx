import type { MouseEvent } from "react";
import { useRef } from "react";
import { PAGES } from "./generated/pages";
import "./styles.css";

export type DocsBrowserProps = {
  slug?: string;
  onNavigate?: (slug: string) => void;
};

export function DocsBrowser({ slug, onNavigate }: DocsBrowserProps) {
  const active = slug ?? PAGES[0].slug;
  const page = PAGES.find((entry) => entry.slug === active) ?? PAGES[0];
  const contentRef = useRef<HTMLElement>(null);

  const onContentClick = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest("a[data-doc-slug]");
    const next = link?.getAttribute("data-doc-slug");
    if (!next) {
      return;
    }
    event.preventDefault();
    onNavigate?.(next);
  };

  const onTocClick = (headingSlug: string) => {
    const heading = contentRef.current?.querySelector(
      `#${CSS.escape(headingSlug)}`,
    );
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="docs" data-docs-variant="markdown-it">
      <nav className="docs-sidebar" aria-label="Documentation">
        <p className="docs-sidebar__heading">Documentation</p>
        <ul className="docs-sidebar__list">
          {PAGES.map((entry) => (
            <li key={entry.slug}>
              <button
                type="button"
                className="docs-sidebar__link"
                aria-current={entry.slug === page.slug ? "page" : undefined}
                onClick={() => onNavigate?.(entry.slug)}
              >
                {entry.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: onClick only delegates clicks on real anchors, which are already keyboard reachable */}
      <article
        className="docs-prose"
        key={page.slug}
        ref={contentRef}
        onClick={onContentClick}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated at build time from this repo's markdown
        dangerouslySetInnerHTML={{ __html: page.html }}
      />

      {page.headings.length > 0 && (
        <aside className="docs-toc" aria-label="On this page">
          <p className="docs-toc__heading">On this page</p>
          <ul className="docs-toc__list">
            {page.headings.map((heading) => (
              <li
                key={heading.slug}
                className={`docs-toc__item docs-toc__item--level-${heading.level}`}
              >
                <button type="button" onClick={() => onTocClick(heading.slug)}>
                  {heading.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
