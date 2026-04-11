import Server from "lume/core/server.ts";
import expires from "lume/middlewares/expires.ts";
import notFound from "lume/middlewares/not_found.ts";
import noCors from "lume/middlewares/no_cors.ts";
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
