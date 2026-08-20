import { Site } from "lume/core.ts";

export default function moveToc() {
  return (site: Site) => {
    site.process([".html"], (pages) => {
      for (const page of pages) {
        const html = page.document?.html;
        if (!html) continue;

        const tocNav = page.document.querySelector("nav.toc");
        if (!tocNav) continue;

        const md = page.content?.toString();
        if (!md) continue;

        const paraIndex = getParaIndexBeforePlaceholder(md, "<#toc#>");
        if (paraIndex < 0) continue;

        tocNav.remove();

        const paragraphs = page.document.querySelectorAll("p");
        if (paraIndex >= paragraphs.length) continue;

        const before = paragraphs[paraIndex];
        before.insertAdjacentHTML("afterend", tocNav.outerHTML);
      }
    });
  };
}

function getParaIndexBeforePlaceholder(
  markdown: string,
  placeholder: string,
): number {
  const lines = markdown.split("\n");
  let paraCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || /^#+\s/.test(trimmed)) {
      continue;
    }

    if (trimmed === placeholder) {
      return paraCount;
    }

    paraCount++;
  }

  return -1;
}
