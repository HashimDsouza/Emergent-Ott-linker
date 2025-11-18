import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import { Users, Plus, Check, X, Sparkles, TrendingUp, Activity, Trophy, ChevronDown, Flame } from "lucide-react";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const Crew = () => {
  const [crews, setCrews] = useState([]);
  const [myCrews, setMyCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [newCrew, setNewCrew] = useState({ name: "", icon: "🎬", description: "" });
  const [joiningCrew, setJoiningCrew] = useState(null);
  const [hoveredCapsule, setHoveredCapsule] = useState(null);

  const iconOptions = ["🎬", "🏏", "📺", "⚽", "🎵", "🌍", "🎮", "🍿", "🎭", "📚", "🏀", "🎸"];

  // Mock data for activity feed
  const recentActivity = [
    { crew: "Cricket Crazy", action: "shared Lagaan", reactions: 23, time: "2h ago", emoji: "🏏" },
    { crew: "Bollywood Buffs", action: "added 3 new items", reactions: 15, time: "4h ago", emoji: "🎬" },
    { crew: "Regional Riders", action: "reacted to Pushpa 2", reactions: 45, time: "5h ago", emoji: "🇮🇳" },
    { crew: "International Bingers", action: "shared Squid Game S2", reactions: 67, time: "6h ago", emoji: "🌍" },
    { crew: "Music Mavens", action: "added Spotify playlist", reactions: 12, time: "8h ago", emoji: "🎵" },
  ];

  // Mock data for trending content
  const trendingContent = [
    { title: "Sacred Games", reactions: 156, crews: 8, thumbnail: "https://image.tmdb.org/t/p/w500/jzIeFqVvZ5iJzP6P7XlzRbZdQvy.jpg" },
    { title: "Pushpa 2", reactions: 134, crews: 6, thumbnail: "https://image.tmdb.org/t/p/w500/8lbf4nOeHqR9OQGXS2E4TipziQB.jpg" },
    { title: "Mirzapur S3", reactions: 98, crews: 5, thumbnail: "https://image.tmdb.org/t/p/w500/7CFdq8M9ZuP1QRLaBG2ExdcrCBs.jpg" },
    { title: "Squid Game S2", reactions: 87, crews: 7, thumbnail: "https://image.tmdb.org/t/p/w500/sXZhtWLo3fecavpDuOyJiayjt32.jpg" },
  ];

  // Mock leaderboard
  const topCrews = [
    { name: "Cricket Crazy", reactions: 234, emoji: "🏏" },
    { name: "Bollywood Buffs", reactions: 189, emoji: "🎬" },
    { name: "International Bingers", reactions: 156, emoji: "🌍" },
    { name: "Regional Riders", reactions: 134, emoji: "🇮🇳" },
    { name: "Football Fanatics", reactions: 98, emoji: "⚽" },
  ];

  useEffect(() => {
    fetchCrews();
    fetchMyCrews();
  }, []);

  const fetchCrews = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://crew-discovery.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/crew/list`);
      const data = await response.json();
      setCrews(data);
    } catch (error) {
      console.error("Error fetching crews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCrews = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://crew-discovery.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/crew/my-crews?user_id=anonymous`);
      const data = await response.json();
      setMyCrews(data);
    } catch (error) {
      console.error("Error fetching my crews:", error);
    }
  };

  const handleJoinCrew = async (crewId) => {
    setJoiningCrew(crewId);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://crew-discovery.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/crew/${crewId}/join?user_id=anonymous`, {
        method: "POST"
      });
      
      await fetchCrews();
      await fetchMyCrews();
    } catch (error) {
      console.error("Error joining crew:", error);
    } finally {
      setJoiningCrew(null);
    }
  };

  const handleLeaveCrew = async (crewId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://crew-discovery.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/crew/${crewId}/leave?user_id=anonymous`, {
        method: "POST"
      });
      
      await fetchCrews();
      await fetchMyCrews();
    } catch (error) {
      console.error("Error leaving crew:", error);
    }
  };

  const handleCreateCrew = async (e) => {
    e.preventDefault();
    if (!newCrew.name.trim()) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://crew-discovery.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/crew/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCrew,
          founder_id: "anonymous"
        })
      });

      setNewCrew({ name: "", icon: "🎬", description: "" });
      setShowCreateForm(false);
      setActiveView("discover");
      await fetchCrews();
      await fetchMyCrews();
    } catch (error) {
      console.error("Error creating crew:", error);
    }
  };

  const isJoined = (crewId) => {
    return myCrews.some(c => c.id === crewId);
  };

  return (
    <>
      <ConnectorHeader />
      <div className="min-h-screen pb-32" style={{ backgroundColor: charcoal }}>
        {/* Header - Match GetWithIt Style */}
        <div className="px-3 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Crew
            </h1>
            <p className="text-sm md:text-base" style={{ color: coral }}>
              Find Your Tribe
            </p>
          </div>
        </div>

        {/* Category Capsules - Match GetWithIt Design */}
        <div className="px-3 md:px-6 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center gap-2 md:gap-3">
              <button
                onClick={() => {
                  setActiveView("discover");
                  setShowCreateForm(false);
                }}
                onMouseEnter={() => setHoveredCapsule("discover")}
                onMouseLeave={() => setHoveredCapsule(null)}
                className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white"
                style={{
                  background: activeView === "discover"
                    ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                    : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                  boxShadow: hoveredCapsule === "discover" || activeView === "discover" ? `0 0 16px ${mint}60` : 'none',
                  opacity: activeView === "discover" ? 1 : 0.85
                }}
              >
                🔍 Discover Crews
              </button>
              
              <button
                onClick={() => {
                  setActiveView("create");
                  setShowCreateForm(true);
                }}
                onMouseEnter={() => setHoveredCapsule("create")}
                onMouseLeave={() => setHoveredCapsule(null)}
                className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white"
                style={{
                  background: activeView === "create"
                    ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                    : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                  boxShadow: hoveredCapsule === "create" || activeView === "create" ? `0 0 16px ${mint}60` : 'none',
                  opacity: activeView === "create" ? 1 : 0.85
                }}
              >
                ✨ Create Crew
              </button>

              <button
                onClick={() => setActiveView("more")}
                onMouseEnter={() => setHoveredCapsule("more")}
                onMouseLeave={() => setHoveredCapsule(null)}
                className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white"
                style={{
                  background: activeView === "more"
                    ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                    : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                  boxShadow: hoveredCapsule === "more" || activeView === "more" ? `0 0 16px ${mint}60` : 'none',
                  opacity: activeView === "more" ? 1 : 0.85
                }}
              >
                ⚡ More
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 md:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Create Crew Form */}
                <AnimatePresence>
                  {showCreateForm && activeView === "create" && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-6"
                    >
                      <form onSubmit={handleCreateCrew} className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-white/20"
                        style={{
                          background: `linear-gradient(135deg, ${coral}15 0%, ${mint}10 100%)`
                        }}
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
                          style={{ background: `radial-gradient(circle, ${mint} 0%, transparent 70%)` }}
                        />
                        
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 relative z-10">
                          Start Your Own Crew
                        </h3>
                        
                        <div className="space-y-5 relative z-10">
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                              Crew Name *
                            </label>
                            <input
                              type="text"
                              maxLength={30}
                              value={newCrew.name}
                              onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                              placeholder="e.g., Thriller Junkies"
                              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:border-mint transition-all"
                              required
                            />
                            <p className="text-xs text-gray-400 mt-1.5">{newCrew.name.length}/30</p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-white mb-3">
                              Choose Icon
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {iconOptions.map((icon) => (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => setNewCrew({ ...newCrew, icon })}
                                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all transform hover:scale-110"
                                  style={{
                                    background: newCrew.icon === icon 
                                      ? `linear-gradient(135deg, ${coral}30 0%, ${mint}30 100%)`
                                      : 'rgba(255, 255, 255, 0.08)',
                                    border: `2px solid ${newCrew.icon === icon ? mint : 'transparent'}`,
                                    boxShadow: newCrew.icon === icon ? `0 0 20px ${mint}40` : 'none'
                                  }}
                                >
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                              Description (optional)
                            </label>
                            <textarea
                              maxLength={200}
                              value={newCrew.description}
                              onChange={(e) => setNewCrew({ ...newCrew, description: e.target.value })}
                              placeholder="What's your crew about?"
                              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:border-mint resize-none transition-all"
                              rows={3}
                            />
                            <p className="text-xs text-gray-400 mt-1.5">{newCrew.description.length}/200</p>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-4 rounded-full text-white font-bold text-base shadow-lg transform hover:scale-[1.02] transition-all"
                            style={{ 
                              background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                              boxShadow: `0 8px 24px ${coral}40`
                            }}
                          >
                            Create Crew
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* My Crews Section */}
                {myCrews.length > 0 && activeView === "discover" && (
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <span style={{ color: mint }}>●</span> Your Crews
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {myCrews.map((crew) => (
                        <CrewCard
                          key={crew.id}
                          crew={crew}
                          isJoined={true}
                          onAction={() => handleLeaveCrew(crew.id)}
                          isLoading={joiningCrew === crew.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Crews Section */}
                {activeView === "discover" && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <span style={{ color: coral }}>●</span> {myCrews.length > 0 ? "Explore More" : "All Crews"}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {crews
                        .filter(crew => !isJoined(crew.id))
                        .map((crew) => (
                          <CrewCard
                            key={crew.id}
                            crew={crew}
                            isJoined={false}
                            onAction={() => handleJoinCrew(crew.id)}
                            isLoading={joiningCrew === crew.id}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* More Section - Placeholder */}
                {activeView === "more" && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                    <p className="text-gray-400">More crew features are on the way!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
    </>
  );
};

// Crew Card Component - Premium Design
const CrewCard = ({ crew, isJoined, onAction, isLoading }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Special handling for Regional Riders - use India flag
  const getCrewIcon = () => {
    if (crew.name === "Regional Riders") {
      return "🇮🇳";
    }
    return crew.icon;
  };

  // Generate gradient background for each crew
  const getGradientBg = () => {
    const gradients = {
      "International Bingers": `linear-gradient(135deg, #FF4F6415 0%, #30E0B215 100%)`,
      "Cricket Crazy": `linear-gradient(135deg, #10B98115 0%, #34D39915 100%)`,
      "Binge Buddies": `linear-gradient(135deg, #8B5CF615 0%, #C084FC15 100%)`,
      "Weekend Warriors": `linear-gradient(135deg, #F59E0B15 0%, #EF444415 100%)`,
      "Regional Riders": `linear-gradient(135deg, #FF9F4015 0%, #FF6B9515 100%)`,
      "Music Maniacs": `linear-gradient(135deg, #EC489915 0%, #F4343415 100%)`
    };
    return gradients[crew.name] || `linear-gradient(135deg, ${coral}10 0%, ${mint}10 100%)`;
  };

  // Get glow color based on crew
  const getGlowColor = () => {
    if (crew.name === "Cricket Crazy") return "#10B981";
    if (crew.name === "Regional Riders") return "#FF6B95";
    if (crew.name === "Music Maniacs") return "#F43434";
    return mint;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl p-4 md:p-6 border transition-all cursor-pointer group"
      style={{
        background: getGradientBg(),
        borderColor: isHovered ? `${getGlowColor()}60` : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isHovered ? `0 8px 32px ${getGlowColor()}30` : 'none',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      }}
    >
      {/* Background Glow Effect */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)` }}
      />

      {/* Header with Icon and Badge */}
      <div className="flex items-start justify-between mb-3 md:mb-4 relative z-10">
        <div className="text-4xl md:text-5xl transform group-hover:scale-110 transition-transform duration-300">
          {getCrewIcon()}
        </div>
        {crew.is_predefined && (
          <span 
            className="px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${coral}30 0%, ${mint}30 100%)`,
              color: mint,
              border: `1px solid ${mint}40`
            }}
          >
            Official
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-base md:text-xl font-bold text-white mb-1.5 md:mb-2 line-clamp-1">
          {crew.name}
        </h3>
        <p className="text-xs md:text-sm text-gray-300 mb-3 md:mb-4 line-clamp-2 leading-relaxed">
          {crew.description}
        </p>

        {/* Footer with Members and Action */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold" style={{ color: getGlowColor() }}>
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>{crew.member_count.toLocaleString()}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            disabled={isLoading}
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold text-white transition-all flex items-center justify-center gap-1.5 transform hover:scale-105"
            style={{
              background: isJoined 
                ? 'rgba(255, 255, 255, 0.15)' 
                : `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
              border: isJoined ? `1px solid ${coral}60` : 'none',
              opacity: isLoading ? 0.5 : 1,
              boxShadow: !isJoined ? `0 4px 12px ${coral}30` : 'none'
            }}
          >
            {isLoading ? (
              "..."
            ) : isJoined ? (
              <>
                <Check className="w-3 h-3 md:w-4 md:h-4" /> Joined
              </>
            ) : (
              "Join"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Crew;
