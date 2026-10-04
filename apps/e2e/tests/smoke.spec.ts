import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const VARIANTS = ["markdown-it", "marked"] as const;

type Variant = (typeof VARIANTS)[number];

const SLUGS = [
  "overview",
  "docs-browser",
  "getting-started",
  "structure",
  "tooling",
  "nix",
  "offline",
  "testing",
  "ci",
  "adopting",
];

/** Titles come from each source file's first `# ` heading, via the generator. */
const NAV = [
  "nix-pnpm-demo",
  "The docs browser",
  "Getting started",
  "Project structure",
  "Tooling",
  "Nix",
  "Working offline",
  "Testing",
  "Continuous integration",
  "Adopting this template",
];

/**
 * The two packages render the same sources through different parsers. These
 * tests run against both so a behavioural difference cannot be introduced in
 * one implementation only.
 */
for (const variant of VARIANTS) {
  test.describe(variant, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`./#/${variant}/overview`);
    });

    test("renders the frontpage from README.md", async ({ page }) => {
      await expect(page.locator(".docs")).toHaveAttribute(
        "data-docs-variant",
        variant,
      );

      const prose = page.locator(".docs-prose");
      await expect(prose.locator("h1")).toHaveText("nix-pnpm-demo");
      await expect(prose.locator("h2#start-here")).toBeVisible();
    });

    test("sidebar lists every page in nav order", async ({ page }) => {
      await expect(page.locator(".docs-sidebar__link")).toHaveText(NAV);
      await expect(page.locator(".docs-sidebar__link").first()).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    test("sidebar navigates without a full page load", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.dataset.sentinel = "alive";
      });

      await page.getByRole("button", { name: "Nix", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#/${variant}/nix$`));
      await expect(page.locator(".docs-prose h1")).toHaveText("Nix");

      // The sentinel survives, so the SPA handled the route rather than the
      // browser performing a document load.
      await expect(page.locator("html")).toHaveAttribute(
        "data-sentinel",
        "alive",
      );
    });

    test("heading ids are present and the table of contents matches", async ({
      page,
    }) => {
      const toc = page.locator(".docs-toc__item button");
      await expect(toc.first()).toBeVisible();

      const ids = await page
        .locator(".docs-prose h2[id], .docs-prose h3[id]")
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(ids.length).toBeGreaterThan(0);

      const labels = await toc.allInnerTexts();
      expect(labels).toHaveLength(ids.length);

      // Clicking a table-of-contents entry must scroll its heading into view.
      await toc.first().click();
      await expect(page.locator(`#${ids[0]}`)).toBeInViewport();
    });

    test("renders GitHub alert syntax as a labelled callout", async ({
      page,
    }) => {
      await page.goto(`./#/${variant}/offline`);
      const callout = page.locator(".docs-callout").first();
      await expect(callout).toBeVisible();
      await expect(callout.locator(".docs-callout__label")).toHaveText(
        /Note|Warning|Tip|Important|Caution/,
      );
    });

    test("intercepts cross-document links in the article body", async ({
      page,
    }) => {
      const link = page.locator(".docs-prose a[data-doc-slug]").first();
      const slug = await link.getAttribute("data-doc-slug");
      await link.click();

      await expect(page).toHaveURL(new RegExp(`#/${variant}/${slug}$`));
      await expect(page.locator(".docs-prose h1")).not.toHaveText(
        "nix-pnpm-demo",
      );
    });

    /**
     * The test above runs from the frontpage, where every link is written as
     * `./docs/pages/<slug>.md`. Pages link to each other with the sibling form
     * `./<slug>.md` instead, and those links were inert in the app because
     * nothing tagged them. Navigating from a page that has no frontpage-style
     * link is the only way to reach that path.
     */
    test("intercepts sibling links between pages", async ({ page }) => {
      await page.goto(`./#/${variant}/nix`);

      const link = page
        .locator('.docs-prose a[href$=".md"]:not([href*="docs/pages"])')
        .first();
      await expect(link).toHaveAttribute("data-doc-slug", /.+/);
      const slug = await link.getAttribute("data-doc-slug");

      await link.click();

      await expect(page).toHaveURL(new RegExp(`#/${variant}/${slug}$`));
      await expect(page.locator(".docs-prose h1")).not.toHaveText("Nix");
    });

    /**
     * The regression guard for the bug above: an untagged `.md` link resolves
     * against the document URL, not the app route, so it navigates away from
     * the page instead of switching page. Asserting the absence of untagged
     * links catches any future source that introduces a third link form.
     */
    test("tags every markdown link in the prose for in-app navigation", async ({
      page,
    }) => {
      for (const slug of SLUGS) {
        await page.goto(`./#/${variant}/${slug}`);

        const untagged = await page
          .locator('.docs-prose a[href$=".md"]')
          .evaluateAll((nodes) =>
            nodes
              .filter((node) => !node.hasAttribute("data-doc-slug"))
              .map((node) => node.getAttribute("href")),
          );

        expect(untagged, `untagged markdown links on "${slug}"`).toEqual([]);
      }
    });

    test("falls back to the first page for an unknown slug", async ({
      page,
    }) => {
      await page.goto(`./#/${variant}/does-not-exist`);
      await expect(page.locator(".docs-prose h1")).toHaveText("nix-pnpm-demo");
    });

    test("renders every page without an error boundary", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));

      for (const slug of SLUGS) {
        await page.goto(`./#/${variant}/${slug}`);
        await expect(page.locator(".docs-prose h1")).toBeVisible();
        await expect(page.locator(".docs-prose h1")).not.toBeEmpty();
      }

      expect(errors).toEqual([]);
    });
  });
}

test.describe("chooser", () => {
  test("offers both implementations and preserves the page when switching", async ({
    page,
  }) => {
    await page.goto("./#/");
    await expect(page.locator(".chooser")).toBeVisible();

    const cards = page.locator(".chooser__card");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText("markdown-it");
    await expect(cards.nth(1)).toContainText("marked");

    await cards.nth(0).click();
    await expect(page).toHaveURL(/#\/markdown-it\/overview$/);
    await expect(page.locator(".docs-prose h1")).toHaveText("nix-pnpm-demo");

    // Switching implementation keeps the reader on the same document.
    await page.getByRole("button", { name: "marked" }).click();
    await expect(page).toHaveURL(/#\/marked\/overview$/);
    await expect(page.locator(".docs")).toHaveAttribute(
      "data-docs-variant",
      "marked",
    );
  });
});

test.describe("renderer equivalence", () => {
  /**
   * The comparison that motivated two implementations: markdown-it and marked
   * produce the same document for this repository's markdown.
   *
   * Three differences are normalised, none of which are visible to a reader:
   *
   * - `markdown-it-anchor` adds `tabindex="-1"` to anchored headings.
   * - `marked` escapes `'` as `&#39;`, which the browser already decodes.
   * - The two emit slightly different whitespace *between* block elements.
   *   Whitespace inside `<pre>` is left untouched so a real difference in a
   *   code block would still fail this test.
   */
  function normalise(html: string): string {
    return html
      .replaceAll(' tabindex="-1"', "")
      .replaceAll("&#39;", "'")
      .replace(/>\s+</g, "><")
      .trim();
  }

  async function proseFor(page: Page, variant: Variant, slug: string) {
    await page.goto(`./#/${variant}/${slug}`);
    await expect(page.locator(".docs-prose h1")).toBeVisible();
    return normalise(await page.locator(".docs-prose").innerHTML());
  }

  test("both implementations render identical HTML for every page", async ({
    page,
  }) => {
    const differences: string[] = [];

    for (const slug of SLUGS) {
      const a = await proseFor(page, "markdown-it", slug);
      const b = await proseFor(page, "marked", slug);
      if (a !== b) {
        // Report the first divergence rather than just the page name.
        let at = 0;
        while (at < a.length && a[at] === b[at]) at++;
        differences.push(
          `${slug} at ${at}:\n  markdown-it: ${JSON.stringify(a.slice(at, at + 120))}\n  marked:      ${JSON.stringify(b.slice(at, at + 120))}`,
        );
      }
    }

    expect(differences).toEqual([]);
  });

  test("both implementations produce identical heading ids", async ({
    page,
  }) => {
    for (const slug of SLUGS) {
      const ids = async (variant: Variant) => {
        await page.goto(`./#/${variant}/${slug}`);
        return page
          .locator(".docs-prose h1[id], .docs-prose h2[id], .docs-prose h3[id]")
          .evaluateAll((nodes) => nodes.map((node) => node.id));
      };

      expect(await ids("marked")).toEqual(await ids("markdown-it"));
    }
  });
});
