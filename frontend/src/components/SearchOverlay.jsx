import React, { useState, useEffect } from "react";

const coral = "#FF4F64", mint = "#30E0B2", charcoal = "#0E1514", charcoalSoft = "#173A35";

export default function SearchOverlay({ isOpen, onClose, onSelectItem }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [broResponse, setBroResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Mood chips
  const moodChips = [
    { label: "Weekend binge", query: "series binge worthy" },
    { label: "Something short", query: "movie short runtime" },
    { label: "Live right now", query: "sports live" },
    { label: "Surprise me", query: "trending random" }
  ];

  // Bro's witty responses (templated)
  const broResponses = {
    hasResults: [
      "Got your fix. Six doses of chaos — all legally streamable.",
      "Bro, I found some gems. Check these out.",
      "Here's what's poppin' right now. You're welcome.",
      "Sorted. These should hit the spot.",
      "Found 'em. Time to binge, bro."
    ],
    noResults: [
      "That's deep. But not even I can find that in the TMDB multiverse.",
      "Bro, that's a tough one. Try something else?",
      "Hmm, nada. Wanna try a different vibe?",
      "Nothing here, bro. Let's switch it up.",
      "Empty. But don't worry, I got other suggestions."
    ],
    vague: [
      "Bored already? Let's fix that.",
      "Need more details, bro. What kinda mood you in?",
      "Say more, bro. What you feelin'?",
      "Gimme a hint. Action? Comedy? Drama?",
      "I'm listening. What's the vibe?"
    ]
  };

  const getRandomResponse = (type) => {
    const responses = broResponses[type] || broResponses.vague;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Pattern matching search logic
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setBroResponse(getRandomResponse("vague"));
      setResults([]);
      return;
    }

    setLoading(true);
    setBroResponse("");

    try {
      // Fetch all content
      const response = await fetch(`${BACKEND_URL}/api/content`);
      const allContent = await response.json();

      // Pattern matching
      const lowerQuery = searchQuery.toLowerCase();
      
      // Extract keywords
      const isShort = lowerQuery.includes("short") || lowerQuery.includes("quick");
      const isSeries = lowerQuery.includes("series") || lowerQuery.includes("show") || lowerQuery.includes("binge");
      const isMovie = lowerQuery.includes("movie") || lowerQuery.includes("film");
      const isLive = lowerQuery.includes("live") || lowerQuery.includes("sports");
      
      // Genre matching
      const genres = ["action", "comedy", "drama", "thriller", "horror", "romance", "sci-fi"];
      const matchedGenre = genres.find(g => lowerQuery.includes(g));
      
      // Platform matching
      const platforms = ["netflix", "prime", "hotstar", "jio", "sony", "apple"];
      const matchedPlatform = platforms.find(p => lowerQuery.includes(p));

      // Filter results
      let filtered = allContent.filter(item => {
        // Title match
        if (item.title.toLowerCase().includes(lowerQuery)) return true;
        
        // Genre match
        if (matchedGenre && item.genres?.some(g => g.toLowerCase().includes(matchedGenre))) return true;
        
        // Platform match
        if (matchedPlatform && item.platform.toLowerCase().includes(matchedPlatform)) return true;
        
        // Content type match
        if (isSeries && item.content_type === "series") return true;
        if (isMovie && item.content_type === "movie") return true;
        
        // Sports match
        if (isLive && item.category === "game_on") return true;
        
        return false;
      });

      // Runtime filter for "short"
      if (isShort) {
        filtered = filtered.filter(item => item.runtime && item.runtime < 90);
      }

      // Limit to 6 results
      const finalResults = filtered.slice(0, 6);

      setResults(finalResults);
      
      if (finalResults.length > 0) {
        setBroResponse(getRandomResponse("hasResults"));
      } else {
        setBroResponse(getRandomResponse("noResults"));
      }

    } catch (error) {
      console.error("Search error:", error);
      setBroResponse("Yo, something broke. Try again, bro.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle chip click
  const handleChipClick = (chipQuery) => {
    setQuery(chipQuery);
    handleSearch(chipQuery);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  // Close on ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4"
      style={{ backgroundColor: 'rgba(14, 21, 20, 0.95)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Tell me your flavour — chaos, comfort, or cringe?
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm text-white/70">
            <span>Powered by</span>
            <span className="font-semibold" style={{ color: mint }}>Bro</span>
          </div>
        </div>

        {/* Mood Chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {moodChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip.query)}
              className="px-4 py-2 rounded-full text-sm font-medium transition hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(23, 58, 53, 0.6)',
                color: mint,
                border: `1px solid ${mint}40`
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type something like 'funny thrillers on Prime'..."
            className="w-full px-6 py-4 rounded-xl text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: charcoalSoft,
              boxShadow: `0 0 0 1px ${mint}30`
            }}
            autoFocus
          />
          <button
            onClick={() => handleSearch(query)}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 rounded-lg font-medium transition hover:scale-105"
            style={{ backgroundColor: mint, color: charcoal }}
          >
            {loading ? "..." : "Search"}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
        >
          ✕
        </button>

        {/* Bro's Response */}
        {broResponse && (
          <div 
            className="mb-6 p-4 rounded-xl text-center italic"
            style={{ backgroundColor: 'rgba(255, 79, 100, 0.1)', color: coral }}
          >
            "{broResponse}"
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-h-[60vh] md:max-h-96 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-mint/30 scrollbar-track-transparent pb-4">
            {results.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition active:scale-95"
                style={{ backgroundColor: charcoalSoft }}
              >
                {/* Poster */}
                <div style={{ aspectRatio: "2/3" }} className="bg-gradient-to-br from-coral/10 to-mint/10">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {/* Info */}
                <div className="p-2 md:p-2.5">
                  <div className="text-xs md:text-sm font-semibold text-white line-clamp-2 mb-1">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs">
                    <span className="text-white/60 line-clamp-1">{item.platform}</span>
                    {item.imdb && item.imdb !== "N/A" && (
                      <span className="flex-shrink-0" style={{ color: '#fbbf24' }}>⭐ {typeof item.imdb === 'number' ? item.imdb.toFixed(1) : item.imdb}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results suggestions */}
        {results.length === 0 && broResponse && !loading && (
          <div className="text-center text-white/60 text-sm">
            Try: "thriller", "comedy on Netflix", "something short"
          </div>
        )}
      </div>
    </div>
  );
}
