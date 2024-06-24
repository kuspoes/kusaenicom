import type { Middleware } from "lume/core/server.ts";

export default function noRObotai(): Middleware {
  return async (request, next) => {
    const response = await next(request);
    const { headers } = request;
    const banUA = [
      "AdsBot-Google",
      "Amazonbot",
      "anthropic-ai",
      "Applebot",
      "Applebot-Extended",
      "AwarioRssBot",
      "AwarioSmartBot",
      "Bytespider",
      "CCBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-Web",
      "cohere-ai",
      "DataForSeoBot",
      "Diffbot",
      "FacebookBot",
      "FriendlyCrawler",
      "Google-Extended",
      "GoogleOther",
      "GPTBot",
      "img2dataset",
      "ImagesiftBot",
      "magpie-crawler",
      "Meltwater",
      "omgili",
      "omgilibot",
      "peer39_crawler",
      "peer39_crawler/1.0",
      "PerplexityBot",
      "PiplBot",
      "scoop.it",
      "Seekr",
      "YouBot",
    ];
    const getUA = headers.get("user-agent") ?? "";
    const cekUA = banUA.includes(getUA);
    //console.log("User Agent :", getUA);

    if (cekUA === true) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 - Not found</title>
          <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5;}
          svg {
              display: inline;
              width: 40px;
              height: 40px;
              margin-right: 10px;
           }
           h1 { display: flex; flex-direction: row }</style>
        </head>
        <body>
          <h1>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g data-name="Layer 2"><g data-name="lock"><rect width="24" height="24" opacity="0"/><path d="M17 8h-1V6.11a4 4 0 1 0-8 0V8H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-7-1.89A2.06 2.06 0 0 1 12 4a2.06 2.06 0 0 1 2 2.11V8h-4zM18 19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1z"/><path d="M12 12a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></g></g></svg><span>403 - Forbidden</span></h1>
          <p><script>document.write(new Date())</script></p>
        </body></html`,
        {
          status: 403,
          headers: { "Content-type": "text/html" },
        },
      );
    }
    return response;
  };
}
