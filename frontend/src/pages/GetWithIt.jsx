import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const GetWithIt = () => {
  const [feedItems, setFeedItems] = useState([]);
  const [heroItem, setHeroItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

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
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Fetch hero item
      const heroResponse = await fetch(`${backendUrl}/api/feed/hero`);
      if (heroResponse.ok) {
        const hero = await heroResponse.json();
        setHeroItem(hero);
      }
      
      // Fetch feed items
      const categoryParam = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
      const feedResponse = await fetch(`${backendUrl}/api/feed${categoryParam}`);
      
      if (feedResponse.ok) {
        const items = await feedResponse.json();
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
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#C8E6C9] bg-clip-text text-transparent">
            ⚡ Get With It
          </h1>
          <p className="text-sm text-gray-400 mt-1">Stay updated with the latest</p>
        </div>

        {/* Category Filters */}
        <div className="px-4 pb-3 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#FF6B9D] text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
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
                <div className="relative rounded-2xl overflow-hidden group">
                  <img
                    src={heroItem.image_url}
                    alt={heroItem.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryBadgeColor(heroItem.category)}`}>
                      {heroItem.category.toUpperCase()}
                    </span>
                    <h2 className="text-2xl font-bold mb-2">{heroItem.title}</h2>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">{heroItem.description}</p>
                    <p className="text-xs text-gray-400">{formatTimestamp(heroItem.published_at)}</p>
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
                    className="bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all group"
                    onClick={() => handleCardClick(item)}
                  >
                    <div className="flex gap-4 p-4">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryBadgeColor(item.category)}`}>
                          {item.category.toUpperCase()}
                        </span>
                        <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">{item.description}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(item.published_at)}</p>
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
