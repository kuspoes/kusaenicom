import Server from "https://deno.land/x/lume@v1.17.1/core/server.ts";
import expires from "https://deno.land/x/lume@v1.17.1/middlewares/expires.ts";
import notFound from "https://deno.land/x/lume@v1.17.1/middlewares/not_found.ts";

const s = new Server({
   port: 8080,
   root: `${Deno.cwd()}/_site`,
});

s.use(expires());
s.use(notFound({
   root: `${Deno.cwd()}/_site`,
   page404: "/404.html"
}))
s.start();

console.log(`Lume is listening on port: 8080 `);
