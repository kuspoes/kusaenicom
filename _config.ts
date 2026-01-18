import lume from "lume/mod.ts";
import attributes from "lume/plugins/attributes.ts";
import base_path from "lume/plugins/base_path.ts";
import date from "lume/plugins/date.ts";
import { id } from "npm:date-fns@4.1.0/locale/id";
import feed from "lume/plugins/feed.ts";
import prism from "lume/plugins/prism.ts";
import readInfo from "lume/plugins/reading_info.ts";
import toc, { linkInsideHeader } from "markdown-plugins/toc.ts";
import footnotes from "./_plugins/footnotes.ts";
import minifyHTML from "lume/plugins/minify_html.ts";
import sitemap from "lume/plugins/sitemap.ts";
import inline from "lume/plugins/inline.ts";
import nunjucks from "lume/plugins/nunjucks.ts";
import pagefind from "lume/plugins/pagefind.ts";
import purgecss from "lume/plugins/purgecss.ts";

import "https://esm.sh/prismjs@1.29.0/components/prism-shell-session.js";
import "https://esm.sh/prismjs@1.29.0/components/prism-bash.js";

const markdown = {
  plugins: [footnotes],
  keepDefaultPlugins: true,
  options: {
    typographer: true,
  },
};

const isDev = Deno.args.includes("-s");

const site = lume(
  {
    src: "_src",
    prettyUrls: true,
    includes: "_theme",
    location: new URL("https://kusaeni.com"),
  },
  {
    markdown,
  },
);

site
  .copy("assets", "/assets")
  .use(attributes())
  .use(purgecss())
  .use(base_path())
  .use(nunjucks())
  .use(
    date({
      formats: {
        id: "dd MMM yyyy",
        id_tgl: "dd",
        id_bln: "MMM",
        id_thn: "yyyy",
      },
      locales: { id },
    }),
  )
  .use(
    prism({
      theme: {
        name: "default",
        cssFile: "/assets/css/prism.min.css",
      },
    }),
  )
  .use(
    toc({
      anchor: linkInsideHeader(),
    }),
  )
  .use(readInfo())
  .use(
    sitemap({
      sort: "date=desc",
    }),
  )
  .ignore("README.md");

if (!isDev) {
  site.use(
    pagefind({
      ui: { showEmptyFilters: true },
    }),
  );
  site.use(inline()).use(
    minifyHTML({
      extensions: [".html", ".css"],
      options: {
        minify_css: true,
      },
    }),
  );
}

site.use(
  feed({
    output: "feed.xml",
    query: "type=post",
    limit: 10,
    info: {
      title: "=site.title",
      description: "=site.description",
      authorName: "=site.author.name",
      authorUrl: "=site.author.url",
      lang: "id",
    },
    items: {
      title: "=title",
      description: "=excerpt",
      published: "=date",
      content: "$.content",
      lang: "id",
    },
  }),
);

// dont us this helper
site.helper(
  "gambar",
  function (imgSrc: string, imgAlt: string) {
    const tr: string = "?tr=bl-30,q-50";
    return `
        <img
        src="${imgSrc}${tr}"
        data-src="${imgSrc}"
        alt="${imgAlt}"
        class="lazy-image"
        />
      `;
  },
  {
    type: "tag",
  },
);

site.helper(
  "terkait",
  function (
    desc: string,
    title: string,
    url: string,
    format: string = "",
    label: string = "Artikel Terkait",
  ) {
    return `<div class="terkait ${format}">
            <span class="ter">${label}</span>
            <div class="kait">
                <h4><a class="hRelasi" href="${url}">${title}</a></h4>
            <p>${desc}</p>
            </div>
        </div>`;
  },
  {
    // deno-lint-ignore-file
    body: !!true,
    type: "tag",
  },
);

site.helper(
  "relasi",
  function (desc, coverImg, title, penulis, url) {
    const coverUrl = "https://ik.imagekit.io/hjse9uhdjqd/tr:n-cover/buku/";
    return `<div class="relasi m-auto">
            <img class="relaimg" src="${coverUrl}${coverImg}">
            <div class="relasi_meta">
            <div class="juduldkk">
            <h4><a class="hRelasi" href="${url}">${title}</a></h4>
            <p class="author">${penulis}</p>
            </div>
            <p>${desc}</p>
            </div>
        </div>`;
  },
  {
    // deno-lint-ignore-file
    body: !!true,
    type: "tag",
  },
);

site.process([".html"], (pages) => {
  for (const page of pages) {
    for (const img of page.document!.querySelectorAll("div.content img")) {
      if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }
      if (
        img.classList.contains("kus_avatar") ||
        img.classList.contains("layang") ||
        img.classList.contains("gallery-img") ||
        img.classList.contains("fuck")
      ) {
        continue;
      }
      img.classList.add("class", "content-image");
    }
  }
});

export default site;
