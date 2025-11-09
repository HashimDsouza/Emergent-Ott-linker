/**
 * TMDB Image Fetcher for Buzz Meter
 * Searches TMDB for titles and returns backdrop/poster images
 */

const TMDB_API_KEY = '0ec85c952e2d4ee771180e3068544ddf';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

/**
 * Search TMDB for a title and return the best image
 * @param {string} title - The title to search for
 * @param {string} type - 'movie' or 'tv' (optional, will search both)
 * @returns {Promise<string|null>} - Image URL or null if not found
 */
export async function getTMDBImage(title, type = null) {
  try {
    // Clean title (remove extra words like "Trailer", "Social Storm", etc.)
    const cleanTitle = title
      .replace(/trailer/gi, '')
      .replace(/social storm/gi, '')
      .replace(/imdb spike/gi, '')
      .replace(/goes viral/gi, '')
      .replace(/final/gi, '')
      .trim();

    let results = [];

    // Search movies first
    if (!type || type === 'movie') {
      const movieResponse = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=en-US`
      );
      const movieData = await movieResponse.json();
      results = [...results, ...(movieData.results || [])];
    }

    // Search TV shows
    if (!type || type === 'tv') {
      const tvResponse = await fetch(
        `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=en-US`
      );
      const tvData = await tvResponse.json();
      results = [...results, ...(tvData.results || [])];
    }

    // Get the first result with a backdrop
    const itemWithImage = results.find(item => item.backdrop_path || item.poster_path);
    
    if (itemWithImage) {
      // Prefer backdrop (wider) for Buzz Meter tiles
      const imagePath = itemWithImage.backdrop_path || itemWithImage.poster_path;
      return `${TMDB_IMAGE_BASE}${imagePath}`;
    }

    return null;
  } catch (error) {
    console.error('Error fetching TMDB image:', error);
    return null;
  }
}

/**
 * Generate a gradient placeholder as fallback
 * @param {string} title - Title for the placeholder
 * @returns {string} - SVG data URL
 */
export function getGradientPlaceholder(title) {
  const gradients = [
    { start: '#FF4F64', end: '#30E0B2' },
    { start: '#30E0B2', end: '#FF4F64' },
    { start: '#FF8C42', end: '#30E0B2' },
    { start: '#FF4F64', end: '#FF8C42' },
    { start: '#30E0B2', end: '#FF8C42' }
  ];
  
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];
  
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:${gradient.start.replace('#', '%23')};stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:${gradient.end.replace('#', '%23')};stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23g)"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle"%3E${encodeURIComponent(title)}%3C/text%3E%3C/svg%3E`;
}

/**
 * Get images for all buzz moments
 * @param {Array} buzzMoments - Array of buzz moment objects
 * @returns {Promise<Array>} - Updated buzz moments with TMDB images
 */
export async function enrichBuzzMomentsWithImages(buzzMoments) {
  const enrichedMoments = await Promise.all(
    buzzMoments.map(async (moment) => {
      // Extract clean title for TMDB search
      let searchTitle = moment.title;
      let mediaType = null;

      // Special cases
      if (moment.title.includes('Fighter')) {
        searchTitle = 'Fighter';
        mediaType = 'movie';
      } else if (moment.title.includes('ICC') || moment.title.includes('World Cup')) {
        // Sports content - use gradient placeholder
        return {
          ...moment,
          thumbnail: getGradientPlaceholder(moment.title)
        };
      } else if (moment.title.includes('Kapil Sharma')) {
        searchTitle = 'The Great Indian Kapil Show';
        mediaType = 'tv';
      } else if (moment.title.includes('House of the Dragon')) {
        searchTitle = 'House of the Dragon';
        mediaType = 'tv';
      } else if (moment.title.includes('12th Fail')) {
        searchTitle = '12th Fail';
        mediaType = 'movie';
      } else if (moment.title.includes('Maharaja')) {
        searchTitle = 'Maharaja';
        mediaType = 'movie';
      }

      // Fetch TMDB image
      const tmdbImage = await getTMDBImage(searchTitle, mediaType);

      return {
        ...moment,
        thumbnail: tmdbImage || getGradientPlaceholder(moment.title)
      };
    })
  );

  return enrichedMoments;
}
