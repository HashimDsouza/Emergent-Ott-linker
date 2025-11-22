import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import SocialShareModal from "../components/SocialShareModal";
import ShareToCrewModal from "../components/ShareToCrewModal";
import { Users, Plus, Check, X, Sparkles, TrendingUp, Activity, Trophy, ChevronDown, Flame, Heart, ThumbsUp, Eye, Laugh, Frown } from "lucide-react";
import Confetti from "react-confetti";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const Crew = () => {
  const navigate = useNavigate();
  const [crews, setCrews] = useState([]);
  const [myCrews, setMyCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [newCrew, setNewCrew] = useState({ name: "", icon: "🎬", description: "" });
  const [joiningCrew, setJoiningCrew] = useState(null);
  const [hoveredCapsule, setHoveredCapsule] = useState(null);
  const [trendingContent, setTrendingContent] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiRecycle, setConfettiRecycle] = useState(true);
  const [showSocialShareModal, setShowSocialShareModal] = useState(false);
  const [showCrewShareModal, setShowCrewShareModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Setup global function for crew share modal trigger
  useEffect(() => {
    window.openCrewShareModal = (content) => {
      setSelectedContent(content);
      setShowCrewShareModal(true);
    };
    return () => {
      delete window.openCrewShareModal;
    };
  }, []);

  const iconOptions = ["🎬", "🏏", "📺", "⚽", "🎵", "🌍", "🎮", "🍿", "🎭", "📚", "🏀", "🎸"];

  // Mock data for activity feed
  const recentActivity = [
    { crew: "Cricket Crazy", action: "shared Lagaan", reactions: 23, time: "2h ago", emoji: "🏏" },
    { crew: "Bollywood Buffs", action: "added 3 new items", reactions: 15, time: "4h ago", emoji: "🎬" },
    { crew: "Regional Riders", action: "reacted to Pushpa 2", reactions: 45, time: "5h ago", emoji: "🇮🇳" },
    { crew: "International Bingers", action: "shared Squid Game S2", reactions: 67, time: "6h ago", emoji: "🌍" },
    { crew: "Music Mavens", action: "added Spotify playlist", reactions: 12, time: "8h ago", emoji: "🎵" },
  ];

  // State for filtering
  const [filterView, setFilterView] = useState("all"); // "all", "popular", "new", "trending", "recommended"

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
    fetchTrendingContent();
  }, []);

  const fetchTrendingContent = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/content`);
      const data = await response.json();
      
      // Filter for Nov 2025 trending titles that we want to show
      const trendingTitles = ["The Family Man Season 3", "Stranger Things", "Pluribus", "Severance"];
      const trending = data
        .filter(item => trendingTitles.some(title => item.title.includes(title)))
        .slice(0, 4)
        .map(item => ({
          title: item.title,
          reactions: Math.floor(Math.random() * 100) + 50, // Mock reactions
          crews: Math.floor(Math.random() * 8) + 3, // Mock crew count
          thumbnail: item.thumbnail || item.poster_url || item.image_url
        }));
      
      setTrendingContent(trending);
    } catch (error) {
      console.error("Error fetching trending content:", error);
    }
  };

  const fetchCrews = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/crew/${crewId}/join?user_id=anonymous`, {
        method: "POST"
      });
      
      // Trigger confetti animation
      setShowConfetti(true);
      setConfettiRecycle(true);
      setTimeout(() => {
        setConfettiRecycle(false);
        setTimeout(() => setShowConfetti(false), 3000);
      }, 2000);
      
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
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

  const handleAddToWatchlist = async (content) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/watchlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "anonymous",
          content_id: content.id || content.title,
          content_type: "movie",
          content_title: content.title,
          content_image: content.thumbnail || content.poster_url || content.image_url,
        })
      });
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
  };

  const handleShare = (content) => {
    setSelectedContent(content);
    setShowSocialShareModal(true);
  };

  return (
    <>
      <ConnectorHeader />
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={confettiRecycle}
          numberOfPieces={200}
          colors={[coral, mint, '#FFD700', '#FF6B2C', '#9333EA']}
        />
      )}
      
      {/* Share Modals */}
      <SocialShareModal
        isOpen={showSocialShareModal}
        onClose={() => setShowSocialShareModal(false)}
        content={selectedContent || {}}
      />
      <ShareToCrewModal
        isOpen={showCrewShareModal}
        onClose={() => setShowCrewShareModal(false)}
        content={selectedContent || {}}
      />
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

        {/* Crew Capsules - Horizontal Scroll with 6 Popular + More */}
        <div className="px-3 md:px-6 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ overflowY: 'visible' }}>
              {/* First 6 Popular Predefined Crews (exclude user-created) */}
              {crews.filter(crew => crew.is_predefined).slice(0, 6).map((crew) => (
                <button
                  key={crew.id}
                  onClick={() => navigate(`/crew/${crew.id}`)}
                  onMouseEnter={() => setHoveredCapsule(crew.id)}
                  onMouseLeave={() => setHoveredCapsule(null)}
                  className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white whitespace-nowrap flex items-center gap-1.5"
                  style={{
                    background: isJoined(crew.id)
                      ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                      : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                    boxShadow: hoveredCapsule === crew.id ? `0 0 16px ${mint}60` : 'none',
                    opacity: isJoined(crew.id) ? 1 : 0.85
                  }}
                >
                  {crew.name === "Regional Riders" ? "🇮🇳" : crew.icon} {crew.name}
                  {isJoined(crew.id) && <Check className="w-3 h-3" />}
                </button>
              ))}

              {/* More Dropdown */}
              <div className="relative" style={{ zIndex: 9999 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreDropdown(!showMoreDropdown);
                  }}
                  onMouseEnter={() => setHoveredCapsule("more")}
                  onMouseLeave={() => setHoveredCapsule(null)}
                  className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white whitespace-nowrap flex items-center gap-1"
                  style={{
                    background: showMoreDropdown
                      ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                      : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                    boxShadow: hoveredCapsule === "more" || showMoreDropdown ? `0 0 16px ${mint}60` : 'none',
                    opacity: showMoreDropdown ? 1 : 0.85
                  }}
                >
                  ⚡ More <ChevronDown className={`w-3 h-3 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {showMoreDropdown && (
                  <div
                    className="absolute top-full right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl"
                    style={{
                      background: 'rgba(14, 21, 20, 0.98)',
                      backdropFilter: 'blur(20px)',
                      borderColor: 'rgba(48, 224, 178, 0.3)',
                      minWidth: '200px',
                      zIndex: 99999
                    }}
                  >
                    {[
                      { id: "popular", label: "Popular", icon: "🔥" },
                      { id: "new", label: "New", icon: "✨" },
                      { id: "trending", label: "Trending", icon: "📈" },
                      { id: "recommended", label: "Recommended", icon: "💡" },
                      { id: "all", label: "All Crews", icon: "🌟" }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilterView(option.id);
                          setShowMoreDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-all flex items-center gap-2 border-b border-white/5 last:border-0"
                        style={{
                          background: filterView === option.id ? 'rgba(255, 79, 100, 0.15)' : 'transparent'
                        }}
                      >
                        <span className="text-base">{option.icon}</span>
                        <span className="flex-1">{option.label}</span>
                        {filterView === option.id && <Check className="w-4 h-4" style={{ color: mint }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 md:px-6 py-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {loading ? (
              <div className="space-y-8">
                {/* My Crews Skeleton */}
                <div>
                  <div className="h-6 w-32 rounded mb-3 animate-pulse" style={{ background: `${mint}30` }} />
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-shrink-0 w-20 md:w-24">
                        <div className="bg-white/10 rounded-xl p-3 md:p-4 h-24 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Skeleton */}
                <div>
                  <div className="h-6 w-40 rounded mb-3 animate-pulse" style={{ background: `${coral}30` }} />
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-shrink-0 w-32 md:w-40">
                        <div className="aspect-[2/3] rounded-xl animate-pulse" style={{ background: `${coral}20` }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Skeleton */}
                <div>
                  <div className="h-6 w-36 rounded mb-3 animate-pulse" style={{ background: `${mint}30` }} />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-3 md:p-4 h-16 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Create Crew Form */}
                <AnimatePresence>
                  {showCreateForm && (
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

                {/* My Crews - Quick Access */}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span style={{ color: mint }}>🎯</span> My Crews
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Create Crew Card */}
                    <div className="flex-shrink-0 w-20 md:w-24">
                      <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border-2 border-dashed border-white/30 hover:border-mint/50 transition-all cursor-pointer text-center"
                      >
                        <div className="text-3xl md:text-4xl mb-2">✨</div>
                        <p className="text-xs text-white font-semibold">Create</p>
                      </button>
                    </div>
                    
                    {/* User's Joined Crews */}
                    {myCrews.map((crew) => (
                      <QuickCrewCard key={crew.id} crew={crew} onClick={(crewId) => navigate(`/crew/${crewId}`)} />
                    ))}
                    
                    {/* Empty State if no crews */}
                    {myCrews.length === 0 && (
                      <p className="text-sm text-gray-400 py-4">Join crews from the capsules above to see them here!</p>
                    )}
                  </div>
                </div>

                {/* What's Trending */}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Flame className="w-5 h-5" style={{ color: coral }} /> What's Trending
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {trendingContent.map((item, idx) => (
                      <TrendingCard key={idx} item={item} onAddToWatchlist={handleAddToWatchlist} />
                    ))}
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5" style={{ color: mint }} /> Recent Activity
                  </h2>
                  <div className="space-y-2">
                    {recentActivity.map((activity, idx) => (
                      <ActivityItem key={idx} activity={activity} />
                    ))}
                  </div>
                </div>

                {/* Top Crews Leaderboard */}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5" style={{ color: "#FFD700" }} /> Top Crews This Week
                  </h2>
                  <div className="space-y-2">
                    {topCrews.map((crew, idx) => (
                      <LeaderboardItem key={idx} crew={crew} rank={idx + 1} />
                    ))}
                  </div>
                </div>

                {/* Crews You Might Like / Filtered View */}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: mint }} /> 
                    {filterView === "all" && "Crews You Might Like"}
                    {filterView === "popular" && "🔥 Popular Crews"}
                    {filterView === "new" && "✨ New Crews"}
                    {filterView === "trending" && "📈 Trending Crews"}
                    {filterView === "recommended" && "💡 Recommended For You"}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(() => {
                      let filteredCrews = crews.filter(crew => !isJoined(crew.id));
                      
                      // Apply mock filtering logic
                      if (filterView === "popular") {
                        filteredCrews = filteredCrews.sort((a, b) => b.member_count - a.member_count);
                      } else if (filterView === "new") {
                        filteredCrews = filteredCrews.filter(crew => !crew.is_predefined);
                      } else if (filterView === "trending") {
                        filteredCrews = filteredCrews.filter(crew => crew.member_count > 10000);
                      } else if (filterView === "recommended") {
                        // Mock recommendation based on joined crews
                        filteredCrews = filteredCrews.slice(0, 3);
                      }
                      
                      return filteredCrews.slice(0, filterView === "all" ? 3 : 6).map((crew) => (
                        <CrewCard
                          key={crew.id}
                          crew={crew}
                          isJoined={false}
                          onAction={() => handleJoinCrew(crew.id)}
                          isLoading={joiningCrew === crew.id}
                        />
                      ));
                    })()}
                  </div>
                </div>
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

// Quick Crew Card - Compact for "Your Crews"
const QuickCrewCard = ({ crew, onClick }) => {
  const getCrewIcon = () => {
    if (crew.name === "Regional Riders") return "🇮🇳";
    return crew.icon;
  };

  return (
    <div className="flex-shrink-0 w-20 md:w-24">
      <button
        onClick={() => onClick(crew.id)}
        className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:border-mint/50 transition-all cursor-pointer text-center transform hover:scale-105"
      >
        <div className="text-3xl md:text-4xl mb-2">{getCrewIcon()}</div>
        <p className="text-xs text-white font-semibold truncate">{crew.name}</p>
      </button>
    </div>
  );
};

// Trending Content Card
const TrendingCard = ({ item, onAddToWatchlist, onShare }) => {
  const imageUrl = item.thumbnail || item.poster_url || item.image_url;
  const [added, setAdded] = React.useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="flex-shrink-0 w-32 md:w-40">
      <div 
        onClick={() => item.id && navigate(`/content/${item.id}`)}
        className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-coral/50 transition-all cursor-pointer group"
      >
        <div className="aspect-[2/3] relative overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              display: imageUrl ? 'none' : 'flex',
              background: `linear-gradient(135deg, ${coral}30 0%, ${mint}20 100%)`
            }}
          >
            <span className="text-4xl">🎬</span>
          </div>
          
          {/* Add to Watchlist Button - Top Left */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAdded(!added);
              onAddToWatchlist?.(item);
            }}
            className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full backdrop-blur-xl transition-all transform hover:scale-110 flex items-center justify-center"
            style={{
              background: added ? mint : 'rgba(14, 21, 20, 0.75)',
              border: `1px solid ${added ? mint : mint + '40'}`,
              boxShadow: `0 0 12px ${mint}20`,
            }}
          >
            <Check className="w-4 h-4" style={{ color: added ? charcoal : mint }} />
          </button>
          
          {/* Share Button - Top Right */}
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(item);
              }}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full backdrop-blur-xl transition-all transform hover:scale-110 flex items-center justify-center"
              style={{
                background: 'rgba(14, 21, 20, 0.75)',
                border: `1px solid ${mint}40`,
                boxShadow: `0 0 12px ${mint}20`,
              }}
            >
              <svg className="w-4 h-4" style={{ color: mint }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-xs text-white font-bold truncate">{item.title}</p>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="flex items-center gap-1" style={{ color: coral }}>
                <Flame className="w-3 h-3" /> {item.reactions}
              </span>
              <span className="text-gray-400">{item.crews} crews</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Feed Item
const ActivityItem = ({ activity }) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{activity.emoji}</div>
          <div>
            <p className="text-sm text-white">
              <span className="font-bold">{activity.crew}</span> {activity.action}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs flex items-center gap-1" style={{ color: coral }}>
                <Flame className="w-3 h-3" /> {activity.reactions}
              </span>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Leaderboard Item
const LeaderboardItem = ({ crew, rank }) => {
  const getMedalColor = () => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return mint;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ 
              background: `linear-gradient(135deg, ${getMedalColor()}30 0%, ${getMedalColor()}10 100%)`,
              color: getMedalColor(),
              border: `2px solid ${getMedalColor()}`
            }}
          >
            {rank}
          </div>
          <div className="text-2xl">{crew.emoji}</div>
          <p className="text-sm md:text-base font-semibold text-white">{crew.name}</p>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: coral }}>
          <Flame className="w-4 h-4" />
          <span className="text-sm font-bold">{crew.reactions}</span>
        </div>
      </div>
    </div>
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
