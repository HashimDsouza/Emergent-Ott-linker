import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import { Users, ArrowLeft, Check, Flame, Heart, Laugh, Hand } from "lucide-react";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const CrewDetail = () => {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const [crew, setCrew] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState({});

  const reactionEmojis = [
    { id: "fire", icon: <Flame className="w-4 h-4" />, emoji: "🔥", color: "#FF6B35" },
    { id: "heart", icon: <Heart className="w-4 h-4" />, emoji: "❤️", color: "#FF1744" },
    { id: "laugh", icon: <Laugh className="w-4 h-4" />, emoji: "😂", color: "#FFD700" },
    { id: "clap", icon: <Hand className="w-4 h-4" />, emoji: "👏", color: mint },
  ];

  useEffect(() => {
    fetchCrewDetails();
    fetchWatchlist();
  }, [crewId]);

  const fetchCrewDetails = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-3.preview.emergentagent.com";
      
      // Fetch crew details
      const crewResponse = await fetch(`${backendUrl}/api/crew/list`);
      const crews = await crewResponse.json();
      const foundCrew = crews.find(c => c.id === crewId);
      setCrew(foundCrew);

      // Check if user has joined
      const myCrewsResponse = await fetch(`${backendUrl}/api/crew/my-crews?user_id=anonymous`);
      const myCrews = await myCrewsResponse.json();
      setIsJoined(myCrews.some(c => c.id === crewId));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching crew details:", error);
      setLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-3.preview.emergentagent.com";
      
      // Fetch real watchlist items shared with this crew
      const watchlistResponse = await fetch(`${backendUrl}/api/watchlist/crew/${crewId}`);
      const watchlistData = await watchlistResponse.json();
      
      // Enrich with mock reactions (until reactions API is fully integrated)
      const enrichedWatchlist = watchlistData.map(item => ({
        ...item,
        id: item.content_id,
        title: item.content_title,
        thumbnail: item.content_image,
        shared_by: "Anonymous User",
        shared_at: item.created_at,
        reactions: {
          fire: Math.floor(Math.random() * 50),
          heart: Math.floor(Math.random() * 30),
          laugh: Math.floor(Math.random() * 20),
          clap: Math.floor(Math.random() * 40),
        }
      }));
      
      setWatchlist(enrichedWatchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      setWatchlist([]);
    }
  };

  const handleJoinLeave = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-3.preview.emergentagent.com";
      const endpoint = isJoined ? "leave" : "join";
      
      await fetch(`${backendUrl}/api/crew/${crewId}/${endpoint}?user_id=anonymous`, {
        method: "POST"
      });
      
      setIsJoined(!isJoined);
      if (crew) {
        setCrew({
          ...crew,
          member_count: isJoined ? crew.member_count - 1 : crew.member_count + 1
        });
      }
    } catch (error) {
      console.error("Error joining/leaving crew:", error);
    }
  };

  const handleReaction = (itemId, reactionType) => {
    setWatchlist(watchlist.map(item => {
      if (item.id === itemId) {
        const userReacted = reactions[itemId] === reactionType;
        const newReactions = { ...item.reactions };
        
        if (userReacted) {
          // Remove reaction
          newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
          setReactions(prev => ({ ...prev, [itemId]: null }));
        } else {
          // Add reaction (remove old one if exists)
          if (reactions[itemId]) {
            newReactions[reactions[itemId]] = Math.max(0, newReactions[reactions[itemId]] - 1);
          }
          newReactions[reactionType] = newReactions[reactionType] + 1;
          setReactions(prev => ({ ...prev, [itemId]: reactionType }));
        }
        
        return { ...item, reactions: newReactions };
      }
      return item;
    }));
  };

  const getCrewIcon = () => {
    if (!crew) return "🎬";
    if (crew.name === "Regional Riders") return "🇮🇳";
    return crew.icon;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const shared = new Date(timestamp);
    const diffMs = now - shared;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return shared.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <>
        <ConnectorHeader />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: charcoal }}>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </>
    );
  }

  if (!crew) {
    return (
      <>
        <ConnectorHeader />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: charcoal }}>
          <div className="text-white text-xl">Crew not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConnectorHeader />
      <div className="min-h-screen pb-32" style={{ backgroundColor: charcoal }}>
        {/* Crew Header */}
        <div className="px-3 md:px-6 pt-4 md:pt-6 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate("/crew")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-all mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Crews</span>
            </button>

            {/* Crew Info */}
            <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${coral}15 0%, ${mint}10 100%)`
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
                style={{ background: `radial-gradient(circle, ${mint} 0%, transparent 70%)` }}
              />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                <div className="text-6xl md:text-7xl">{getCrewIcon()}</div>
                
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {crew.name}
                  </h1>
                  <p className="text-sm md:text-base text-gray-300 mb-4 max-w-2xl">
                    {crew.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" style={{ color: mint }}>
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">{crew.member_count.toLocaleString()} members</span>
                    </div>
                    {crew.is_predefined && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                        background: `linear-gradient(135deg, ${coral}30 0%, ${mint}30 100%)`,
                        color: mint,
                        border: `1px solid ${mint}40`
                      }}>
                        Official
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleJoinLeave}
                  className="px-6 py-3 rounded-full font-bold text-white transition-all transform hover:scale-105 flex items-center gap-2"
                  style={{
                    background: isJoined
                      ? 'rgba(255, 255, 255, 0.1)'
                      : `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                    border: isJoined ? `2px solid ${coral}` : 'none',
                    boxShadow: !isJoined ? `0 8px 24px ${coral}40` : 'none'
                  }}
                >
                  {isJoined ? (
                    <>
                      <Check className="w-5 h-5" /> Joined
                    </>
                  ) : (
                    "Join Crew"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="px-3 md:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span style={{ color: coral }}>📺</span> Crew Watchlist
            </h2>

            {watchlist.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="text-7xl mb-4 animate-bounce">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-3">This crew is just getting started!</h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  Be the first to share something awesome and get the conversation going
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 rounded-full font-bold text-white transition-all transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                    boxShadow: `0 8px 24px ${coral}40`
                  }}
                >
                  Browse Content to Share
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {watchlist.map((item) => (
                  <WatchlistCard
                    key={item.id}
                    item={item}
                    reactions={reactionEmojis}
                    userReaction={reactions[item.id]}
                    onReact={(reactionType) => handleReaction(item.id, reactionType)}
                    formatTimeAgo={formatTimeAgo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
    </>
  );
};

// Watchlist Card Component
const WatchlistCard = ({ item, reactions, userReaction, onReact, formatTimeAgo }) => {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      {/* Content Tile */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
        {/* Thumbnail */}
        <div className="aspect-[2/3] relative overflow-hidden">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-coral/20 to-mint/20">
              <span className="text-4xl">🎬</span>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Content Info */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-xs text-white font-bold line-clamp-2 mb-1">{item.title}</p>
            <p className="text-xs text-gray-400">{formatTimeAgo(item.shared_at)}</p>
          </div>
        </div>

        {/* Reactions Bar */}
        <div className="p-2 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-1">
            {reactions.map((reaction) => {
              const count = item.reactions[reaction.id] || 0;
              const isActive = userReaction === reaction.id;
              
              return (
                <button
                  key={reaction.id}
                  onClick={() => onReact(reaction.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all transform hover:scale-110"
                  style={{
                    background: isActive ? `${reaction.color}30` : 'transparent',
                    border: isActive ? `1px solid ${reaction.color}` : '1px solid transparent'
                  }}
                >
                  <span className="text-sm">{reaction.emoji}</span>
                  {count > 0 && (
                    <span className="text-xs font-bold" style={{ color: isActive ? reaction.color : '#fff' }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CrewDetail;
