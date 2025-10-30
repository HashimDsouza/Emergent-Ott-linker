export const mapApiToCard = (x) => ({
  id: x.id ?? String(Math.random()),
  title: x.title ?? "Title",
  platform: x.platform ?? "JioHotstar",
  posterUrl: x.thumbnail ?? x.poster_url ?? null,
  imdb: x.imdb_rating ?? x.rating ?? null,
  descriptor: x.tagline ?? "Trending on YouTube",
  buzz: x.social_links ?? { yt: null, x: null, reddit: null },
});