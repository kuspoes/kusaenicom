import lume from "lume/mod.ts";
import attributes from "lume/plugins/attributes.ts";
import base_path from "lume/plugins/base_path.ts";
import date from "lume/plugins/date.ts";
import { id } from "npm:date-fns/locale/id";
import feed from "lume/plugins/feed.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import readInfo from "lume/plugins/reading_info.ts";
import toc from "https://deno.land/x/lume_markdown_plugins@v0.7.0/toc.ts";
import footnotes from "./_plugins/footnotes.ts";
import title from "https://deno.land/x/lume_markdown_plugins@v0.7.0/title.ts";
import minifyHTML from "lume/plugins/minify_html.ts";
import sitemap from "lume/plugins/sitemap.ts";
import inline from "lume/plugins/inline.ts";

async function cors(request: Request, next: Lume.RequestHandler) {
  const response = await next(request);
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

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
    server: {
      middlewares: [cors],
    },
  },
  {
    markdown,
  },
);

site
  .use(attributes())
  .use(base_path())
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
        title: "=metas.site",
        description: "=metas.description",
        lang: "id",
      },
      items: {
        title: "=title",
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
    codeHighlight({
      theme: {
        name: "tmrw",
        path: "/_assets/css/tmrw.css",
      },
    }),
  )
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

site.helper("uppercase", (body) => body.toUpperCase(), {
  type: "tag",
  // deno-lint-ignore-file
  body: !!"true",
});

site.helper(
  "terkait",
  function (desc: string, title: string, url: string) {
    return `<div class="terkait">
            <span class="ter">Artikel Terkait</span>
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

export default site;
