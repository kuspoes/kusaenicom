import Server from "https://deno.land/x/lume/core/server.ts";
import expires from "https://deno.land/x/lume/middlewares/expires.ts";

const s = new Server({
   port: 8080,
   root: `${Deno.cwd()}/_site`,
});

s.use(expires());
s.start();

console.log(`Listening on port: ${ port } `);
