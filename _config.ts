import lume from "lume/mod.ts";
import attributes from "lume/plugins/attributes.ts";
import base_path from "lume/plugins/base_path.ts";
import date from "lume/plugins/date.ts";
import { id } from "npm:date-fns/locale/id";
import feed from "lume/plugins/feed.ts";
//import codeHighlight from "lume/plugins/code_highlight.ts";
import prism from "lume/plugins/prism.ts";
import readInfo from "lume/plugins/reading_info.ts";
import toc from "https://deno.land/x/lume_markdown_plugins@v0.7.0/toc.ts";
import footnotes from "./_plugins/footnotes.ts";
import title from "https://deno.land/x/lume_markdown_plugins@v0.7.0/title.ts";
import minifyHTML from "lume/plugins/minify_html.ts";
import sitemap from "lume/plugins/sitemap.ts";
import inline from "lume/plugins/inline.ts";
import nunjucks from "lume/plugins/nunjucks.ts";
import pagefind from "lume/plugins/pagefind.ts";

import "npm:prismjs@1.29.0/components/prism-shell-session.min.js";

const markdown = {
  plugins: [footnotes],
  keepDefaultPlugins: true,
};

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
  .use(attributes())
  .use(base_path())
  .use(nunjucks())
  .use(pagefind())
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
  .use(inline())
  .use(
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
      },
    }),
  )
  .use(
    minifyHTML({
      extensions: [".html", ".css"],
      options: {
        minify_css: true,
      },
    }),
  )
  .use(
    prism({
      theme: {
        name: "prism.min",
        path: "assets/css/prism.min.css",
      },
    }),
  )
  //  .use(
  //    codeHighlight({
  //      theme: {
  //        name: "tmrw",
  //        path: "/_assets/css/tmrw.css",
  //      },
  //    }),
  //  )
  .use(readInfo())
  .use(toc())
  .use(title())
  .use(
    sitemap({
      sort: "date=desc",
    }),
  )
  .copy("_assets", "assets")
  .ignore("README.md");

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
    body: !!"true",
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
    body: !!"true",
    type: "tag",
  },
);

site.process([".html"], (pages) => {
  for (const page of pages) {
    for (const img of page.document!.querySelectorAll("img")) {
      if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }
    }
  }
});

export default site;
