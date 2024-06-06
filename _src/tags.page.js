export const layout = "layout/tags.vto";

export default function* ({ search }) {
  // Generate a page for each tag
  for (const tag of search.values("tags")) {
    yield {
      url: `/tags/${tag}/`,
      title: `Artikel dengan tag “${tag}”`,
      type: "tag",
      search_query: `type=post '${tag}'`,
      tag,
    };
  }
}

// nyolong dari tema simple blog
