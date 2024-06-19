import type { Middleware } from "lume/core/server.ts";

export default function expires(): Middleware {
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
    console.log("User Agent :", getUA);

    if (cekUA === true) {
      return new Response(`f`, { status: 403 });
    }
    return response;
  };
}
