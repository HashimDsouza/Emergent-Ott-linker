import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";

// Brand colors - match the app's visual identity
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const GetWithIt = () => {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState([]);
  const [heroItem, setHeroItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const categories = [
    { id: "all", label: "All", icon: "⚡" },
    { id: "entertainment", label: "Entertainment", icon: "🎬" },
    { id: "sports", label: "Sports", icon: "🏏" },
    { id: "ott", label: "OTT", icon: "📺" },
    { id: "local", label: "Local", icon: "🌏" },
    { id: "music", label: "Music", icon: "🎵" }
  ];

  useEffect(() => {
    fetchFeed();
  }, [selectedCategory]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      // Use the same pattern as other pages
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-2.preview.emergentagent.com";
      
      console.log("Fetching from:", backendUrl);
      
      // Fetch hero item
      const heroResponse = await fetch(`${backendUrl}/api/feed/hero`);
      console.log("Hero response status:", heroResponse.status);
      if (heroResponse.ok) {
        const hero = await heroResponse.json();
        console.log("Hero item:", hero);
        setHeroItem(hero);
      }
      
      // Fetch feed items
      const categoryParam = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
      const feedResponse = await fetch(`${backendUrl}/api/feed${categoryParam}`);
      console.log("Feed response status:", feedResponse.status);
      
      if (feedResponse.ok) {
        const items = await feedResponse.json();
        console.log("Feed items count:", items.length);
        // Filter out hero item from regular feed
        const nonHeroItems = items.filter(item => !item.is_hero);
        setFeedItems(nonHeroItems);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (item) => {
    if (item.linked_content_id) {
      // TODO: Open internal content detail modal
      console.log("Open content detail:", item.linked_content_id);
    } else if (item.source_url) {
      window.open(item.source_url, "_blank", "noopener,noreferrer");
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const published = new Date(timestamp);
    const diffMs = now - published;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return published.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    }
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      entertainment: "bg-purple-500/20 text-purple-300",
      sports: "bg-green-500/20 text-green-300",
      ott: "bg-blue-500/20 text-blue-300",
      local: "bg-orange-500/20 text-orange-300",
      music: "bg-pink-500/20 text-pink-300"
    };
    return colors[category] || "bg-gray-500/20 text-gray-300";
  };

  return (
    <>
      <ConnectorHeader />
      <div className="min-h-screen" style={{ backgroundColor: charcoal }}>
        {/* Header - Match Watch On Design */}
        <div className="px-3 md:px-6 pt-6 md:pt-8 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto text-center">
            {/* Home Button - Top Left */}
            <div className="absolute top-6 md:top-8 left-3 md:left-6">
              <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${coral}60 0%, ${mint}40 100%)`,
                  border: `1px solid ${mint}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 16px ${mint}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Home</span>
              </button>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Get With It
            </h1>
            <p 
              className="text-sm md:text-base"
              style={{ color: coral }}
            >
              Stay Updated with the Latest
            </p>
          </div>
        </div>

        {/* Category Capsules - Match Watch On Design (2 Rows) */}
        <div className="px-3 md:px-6 pb-6 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Row 1: First 3 categories */}
            <div className="flex justify-center gap-2 md:gap-3 mb-2 md:mb-3">
              {categories.slice(0, 3).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white"
                  style={{
                    background: selectedCategory === cat.id 
                      ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                      : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                    boxShadow: hoveredCategory === cat.id || selectedCategory === cat.id ? `0 0 16px ${mint}60` : 'none',
                    opacity: selectedCategory === cat.id ? 1 : 0.85
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            {/* Row 2: Last 3 categories */}
            <div className="flex justify-center gap-2 md:gap-3">
              {categories.slice(3).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white"
                  style={{
                    background: selectedCategory === cat.id 
                      ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                      : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                    boxShadow: hoveredCategory === cat.id || selectedCategory === cat.id ? `0 0 16px ${mint}60` : 'none',
                    opacity: selectedCategory === cat.id ? 1 : 0.85
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      {/* Content */}
      <div className="px-3 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
          <>
            {/* Hero Card */}
            {heroItem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 cursor-pointer"
                onClick={() => handleCardClick(heroItem)}
              >
                <div className="relative rounded-3xl overflow-hidden group border border-white/10">
                  <img
                    src={heroItem.image_url}
                    alt={heroItem.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(heroItem.category)}`}>
                        {heroItem.category.toUpperCase()}
                      </span>
                      {heroItem.tags && heroItem.tags.length > 0 && heroItem.tags[0] && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B9D] text-white">
                          {heroItem.tags[0]}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mb-2 leading-tight">{heroItem.title}</h2>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2 leading-snug">{heroItem.description}</p>
                    <p className="text-xs text-[#C8E6C9]">{formatTimestamp(heroItem.published_at)}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Feed Items */}
            {feedItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">Nothing here yet. More stories coming soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all group border border-white/10"
                    onClick={() => handleCardClick(item)}
                  >
                    <div className="flex gap-4 p-4">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-2 flex-wrap">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(item.category)}`}>
                            {item.category.toUpperCase()}
                          </span>
                          {item.tags && item.tags.length > 0 && item.tags[0] && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-[#FF6B9D] text-white">
                              {item.tags[0]}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2 leading-tight">{item.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2 leading-snug">{item.description}</p>
                        <p className="text-xs text-[#C8E6C9]">{formatTimestamp(item.published_at)}</p>
                        {item.linked_content_id && (
                          <span className="inline-block mt-2 text-xs text-[#FF6B9D] font-medium">
                            Watch on Connector →
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GetWithIt;
