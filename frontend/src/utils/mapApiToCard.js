export const mapApiToCard = (x) => ({
  id: x.id ?? String(Math.random()),
  title: x.title ?? "Title",
  platform: x.platform ?? "JioHotstar",
  posterUrl: x.posterUrl ?? null,
  imdb: x.imdb ?? null,
  descriptor: x.descriptor ?? "Trending on YouTube",
  buzz: x.buzz ?? { yt: null, x: null, reddit: null },
});