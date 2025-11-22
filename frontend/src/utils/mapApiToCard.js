export const mapApiToCard = (x) => ({
  id: x.id ?? String(Math.random()),
  title: x.title ?? "Title",
  platform: x.platform ?? "JioHotstar",
  // Use poster_url from TMDB first, fallback to thumbnail
  thumbnail: x.poster_url || x.thumbnail || "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
  posterUrl: x.poster_url || x.thumbnail || null,
  backdrop_path: x.backdrop_path || null,
  // Use IMDb rating if available, otherwise TMDB rating, otherwise fallback
  // Treat 0 or 0.0 as missing data
  imdb: (x.imdb_rating && x.imdb_rating > 0) ? x.imdb_rating : (x.vote_average && x.vote_average > 0) ? x.vote_average : (x.rating && x.rating > 0) ? x.rating : "N/A",
  imdb_id: x.imdb_id || null,
  rating: (x.imdb_rating && x.imdb_rating > 0) ? x.imdb_rating : (x.vote_average && x.vote_average > 0) ? x.vote_average : (x.rating && x.rating > 0) ? x.rating : null,
  descriptor: x.descriptor || "Trust us, this one's worth your time",
  // Pass through enriched metadata
  description: x.description || "A compact, cinematic synopsis that gives just enough to decide.",
  genres: x.genres || ["Thriller", "Heist", "Dark Comedy"],
  cast: x.cast || [],
  crew: x.crew || {},
  trailer_url: x.trailer_url || null,
  streaming_platforms: x.streaming_platforms || [],
  vote_count: x.vote_count || null,
  year: x.year || null,
  runtime: x.runtime || null,
  episodes: x.episodes || null,
  language: x.language || null,
  // Social links
  social_links: x.social_links || { youtube: null, twitter: null, reddit: null },
  buzz: x.social_links ?? { yt: null, x: null, reddit: null },
  category: x.category || "Entertainment",
  content_type: x.content_type || "movie",
  // Curation flags for tray assignment
  curation_flags: x.curation_flags || null
});