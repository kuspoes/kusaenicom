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
          <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5; }</style>
        </head>
        <body>
          <h1>403 - Forbidden</h1>
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
