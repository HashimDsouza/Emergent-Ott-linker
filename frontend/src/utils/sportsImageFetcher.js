/**
 * TheSportsDB Image Fetcher for Game On
 * Fetches team logos, league badges, and match preview images
 */

const SPORTSDB_API_KEY = '3'; // Free tier key
const SPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

/**
 * Get team logo by team name
 * @param {string} teamName - Team name to search
 * @param {string} sport - Sport type (football, cricket, basketball)
 * @returns {Promise<string|null>} - Team badge URL
 */
export async function getTeamLogo(teamName, sport = 'football') {
  try {
    const response = await fetch(
      `${SPORTSDB_BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`
    );
    const data = await response.json();
    
    if (data.teams && data.teams.length > 0) {
      return data.teams[0].strTeamBadge || data.teams[0].strTeamLogo;
    }
    return null;
  } catch (error) {
    console.error('Error fetching team logo:', error);
    return null;
  }
}

/**
 * Get league badge by league name
 * @param {string} leagueName - League name
 * @returns {Promise<string|null>} - League badge URL
 */
export async function getLeagueBadge(leagueName) {
  try {
    const response = await fetch(
      `${SPORTSDB_BASE_URL}/search_all_leagues.php?s=Soccer`
    );
    const data = await response.json();
    
    if (data.countries) {
      const league = data.countries.find(l => 
        l.strLeague.toLowerCase().includes(leagueName.toLowerCase())
      );
      if (league) {
        return league.strBadge;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching league badge:', error);
    return null;
  }
}

/**
 * Create composite match preview image
 * @param {string} team1Logo - Team 1 logo URL
 * @param {string} team2Logo - Team 2 logo URL
 * @param {string} leagueBadge - League badge URL (optional)
 * @returns {string} - Composite image URL or first team logo
 */
export function createMatchPreview(team1Logo, team2Logo, leagueBadge = null) {
  // For now, return team1 logo as preview
  // TODO: Future enhancement - create composite image with both teams
  return team1Logo || team2Logo || getGenericSportImage('football');
}

/**
 * Get generic sport image (fallback)
 * @param {string} sport - Sport type
 * @returns {string} - Generic sport SVG
 */
export function getGenericSportImage(sport) {
  const sportColors = {
    cricket: '#30E0B2',
    football: '#FF4F64',
    basketball: '#FF8C42',
    tennis: '#30E0B2',
    f1: '#FF4F64'
  };
  
  const color = sportColors[sport] || '#30E0B2';
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);
  
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="900"%3E%3Crect fill="%23173A35" width="600" height="900"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="${encodeURIComponent(color)}" font-size="40" font-family="Arial"%3E${sportName}%3C/text%3E%3C/svg%3E`;
}

/**
 * Get sports images for Game On landing tray
 * Pre-defined mappings for common matches
 */
export const SPORTS_IMAGE_MAPPINGS = {
  // Cricket
  'icc': {
    type: 'league',
    url: 'https://www.thesportsdb.com/images/media/league/badge/cricket-icc.png',
    fallback: getGenericSportImage('cricket')
  },
  'ipl': {
    type: 'league',
    url: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/1200px-Indian_Premier_League_Official_Logo.svg.png',
    fallback: getGenericSportImage('cricket')
  },
  'mumbai indians': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/2j74zm1554911012.png',
    fallback: getGenericSportImage('cricket')
  },
  'chennai super kings': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/c6xbhp1554911131.png',
    fallback: getGenericSportImage('cricket')
  },
  
  // Football
  'premier league': {
    type: 'league',
    url: 'https://www.thesportsdb.com/images/media/league/badge/i6o0kh1549879062.png',
    fallback: getGenericSportImage('football')
  },
  'manchester united': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/xzqdr11517251291.png',
    fallback: getGenericSportImage('football')
  },
  'manchester city': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png',
    fallback: getGenericSportImage('football')
  },
  'liverpool': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/uvxuuq1448813372.png',
    fallback: getGenericSportImage('football')
  },
  'arsenal': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/vrtrtp1448813175.png',
    fallback: getGenericSportImage('football')
  },
  'chelsea': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png',
    fallback: getGenericSportImage('football')
  },
  'real madrid': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
    fallback: getGenericSportImage('football')
  },
  'barcelona': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/txqrxy1448813255.png',
    fallback: getGenericSportImage('football')
  },
  
  // Basketball
  'nba': {
    type: 'league',
    url: 'https://www.thesportsdb.com/images/media/league/badge/nba.png',
    fallback: getGenericSportImage('basketball')
  },
  'lakers': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/la-lakers.png',
    fallback: getGenericSportImage('basketball')
  },
  'warriors': {
    type: 'team',
    url: 'https://www.thesportsdb.com/images/media/team/badge/golden-state-warriors.png',
    fallback: getGenericSportImage('basketball')
  }
};

/**
 * Get sports image by keyword
 * @param {string} keyword - Team or league name
 * @returns {string} - Image URL
 */
export function getSportsImage(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  
  // Check direct mappings
  if (SPORTS_IMAGE_MAPPINGS[lowerKeyword]) {
    return SPORTS_IMAGE_MAPPINGS[lowerKeyword].url;
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(SPORTS_IMAGE_MAPPINGS)) {
    if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
      return value.url;
    }
  }
  
  // Fallback to generic image
  if (lowerKeyword.includes('cricket')) return getGenericSportImage('cricket');
  if (lowerKeyword.includes('football') || lowerKeyword.includes('soccer')) return getGenericSportImage('football');
  if (lowerKeyword.includes('basketball')) return getGenericSportImage('basketball');
  if (lowerKeyword.includes('tennis')) return getGenericSportImage('tennis');
  if (lowerKeyword.includes('f1') || lowerKeyword.includes('formula')) return getGenericSportImage('f1');
  
  return getGenericSportImage('sport');
}

/**
 * Enrich sports cards with real images
 * @param {Array} sportsCards - Array of sports card objects
 * @returns {Array} - Enriched sports cards with real images
 */
export function enrichSportsCards(sportsCards) {
  return sportsCards.map(card => {
    let imageUrl = null;
    
    // Try to get image from title
    if (card.title) {
      imageUrl = getSportsImage(card.title);
    }
    
    // Fallback to category/sport
    if (!imageUrl && card.category) {
      imageUrl = getSportsImage(card.category);
    }
    
    // Use found image or keep original
    return {
      ...card,
      thumbnail: imageUrl || card.thumbnail,
      posterUrl: imageUrl || card.posterUrl
    };
  });
}
