import lume from "lume/mod.ts";
import base_path from "lume/plugins/base_path.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import date from "lume/plugins/date.ts";
import id from "https://deno.land/x/date_fns/locale/id/index.js";
import inline from "lume/plugins/inline.ts";
//import minify from "https://raw.githubusercontent.com/lumeland/experimental-plugins/main/minify/minify.ts"
import { Language, minify } from "https://deno.land/x/minifier/mod.ts";

function minifyHTML(page) {
    page.content = minify(Language.HTML, page.content);
}

const site = lume({
   src: "_src",
   dest: "_site",
   prettyUrls: true,
   location: new URL("https://kusaeni.com"),
   server: {
       port: 3003,
       page404: "404/index.html",
       open: false
   }
});

site.use(base_path())
    .use(code_highlight())
    .use(inline())
    .use(date({
       formats: {
          "POST": "dd MMM yy"
       },
       locales: {
          id
       }
    }))
    //.use(minify({
    //    extensions: [".css", ".html", ".js"],
    //    htmlOptions: {
    //        minifyCSS: true,
    //        minifyJS: true
    //    }
    //}))
    .copy("assets")
    .copy("404.html")
    .loadAssets([".css"])   
    
    .helper('relasi', function (desc, coverImg, title, penulis, url) {
        let coverUrl = "https://ik.imagekit.io/hjse9uhdjqd/tr:n-cover/buku/";
        return `<div class="relasi m-auto">
            <img class="relaimg" src="${coverUrl}${coverImg}">
            <div class="relasi_meta">
            <div class="juduldkk">
            <h4><a class="hRelasi" href="${url}">${title}</a></h4>
            <span class="author">${penulis}</span>
            </div>
            <p>${desc}</p>
            </div>
        </div>`
    }, {
        body: "true",
        type: "tag"
    })

    .helper('terkait', function (desc: string, title: string, url: string) {
        return `<div class="terkait">
            <span class="ter">Artikel Terkait</span>
            <div class="kait">
                <h4><a class="hRelasi" href="${url}">${title}</a></h4>
            <p>${desc}</p>
            </div>
        </div>`;
    }, {
        body: 'true',
        type: "tag"
    })

    .process([".html"], (page: string) => {
        page.document.querySelectorAll("img").forEach((img) => {
        if (!img.hasAttribute("loading")) {
            img.setAttribute("loading", "lazy");
           }
        })
    })

    .process([".html"], minifyHTML)

    .preprocess([".html"],
        (page) => (page.data.year = page.data.date.getFullYear())
    );

export default site;
