import Server from "https://deno.land/x/lume@v2.2.1/core/server.ts";
import expires from "https://deno.land/x/lume@v2.2.1/middlewares/expires.ts";
import notFound from "https://deno.land/x/lume@v2.2.1/middlewares/not_found.ts";
import noCors from "https://deno.land/x/lume@v2.2.1/middlewares/no_cors.ts";
import noRobotAI from "./_plugins/no_robotAI.ts";

const s = new Server({
  port: 8080,
  root: `${Deno.cwd()}/_site`,
});

s.use(noRobotAI());
s.use(expires());
s.use(noCors());
s.use(
  notFound({
    root: `${Deno.cwd()}/_site`,
    page404: "/404.html",
  }),
);
s.start();

console.log(`Lume is listening on port: 8080 `);
