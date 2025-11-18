import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import { Users, Plus, Check, X } from "lucide-react";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const Crew = () => {
  const [crews, setCrews] = useState([]);
  const [myCrews, setMyCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCrew, setNewCrew] = useState({ name: "", icon: "🎬", description: "" });
  const [joiningCrew, setJoiningCrew] = useState(null);

  const iconOptions = ["🎬", "🏏", "📺", "⚽", "🎵", "🌍", "🎮", "🍿", "🎭", "📚", "🏀", "🎸"];

  useEffect(() => {
    fetchCrews();
    fetchMyCrews();
  }, []);

  const fetchCrews = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-2.preview.emergentagent.com";
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-2.preview.emergentagent.com";
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-2.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/crew/${crewId}/join?user_id=anonymous`, {
        method: "POST"
      });
      
      // Refresh crews and my crews
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-2.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/crew/${crewId}/leave?user_id=anonymous`, {
        method: "POST"
      });
      
      // Refresh crews and my crews
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-2.preview.emergentagent.com";
      await fetch(`${backendUrl}/api/crew/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCrew,
          founder_id: "anonymous"
        })
      });

      // Reset form and refresh
      setNewCrew({ name: "", icon: "🎬", description: "" });
      setShowCreateForm(false);
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
        {/* Header */}
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

        {/* Content */}
        <div className="px-3 md:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* My Crews Section */}
                {myCrews.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                      My Crews
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                      {myCrews.length > 0 ? "Discover More Crews" : "All Crews"}
                    </h2>
                    <button
                      onClick={() => setShowCreateForm(!showCreateForm)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all"
                      style={{
                        background: showCreateForm ? 'rgba(255, 255, 255, 0.1)' : `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                        border: showCreateForm ? `1px solid ${coral}` : 'none'
                      }}
                    >
                      {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {showCreateForm ? "Cancel" : "Create Crew"}
                    </button>
                  </div>

                  {/* Create Crew Form */}
                  <AnimatePresence>
                    {showCreateForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <form onSubmit={handleCreateCrew} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                          <h3 className="text-lg font-bold text-white mb-4">Create Your Crew</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Crew Name *
                              </label>
                              <input
                                type="text"
                                maxLength={30}
                                value={newCrew.name}
                                onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                                placeholder="e.g., Thriller Junkies"
                                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-mint"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">{newCrew.name.length}/30</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Choose Icon
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {iconOptions.map((icon) => (
                                  <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setNewCrew({ ...newCrew, icon })}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all"
                                    style={{
                                      backgroundColor: newCrew.icon === icon ? `${mint}30` : 'rgba(255, 255, 255, 0.05)',
                                      border: `2px solid ${newCrew.icon === icon ? mint : 'transparent'}`
                                    }}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Description (optional)
                              </label>
                              <textarea
                                maxLength={200}
                                value={newCrew.description}
                                onChange={(e) => setNewCrew({ ...newCrew, description: e.target.value })}
                                placeholder="What's your crew about?"
                                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-mint resize-none"
                                rows={3}
                              />
                              <p className="text-xs text-gray-500 mt-1">{newCrew.description.length}/200</p>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 rounded-full text-white font-semibold"
                              style={{ background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` }}
                            >
                              Create Crew
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Crews Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

// Crew Card Component
const CrewCard = ({ crew, isJoined, onAction, isLoading }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl">{crew.icon}</div>
        {crew.is_predefined && (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-400">
            Official
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{crew.name}</h3>
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{crew.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm" style={{ color: mint }}>
          <Users className="w-4 h-4" />
          <span>{crew.member_count.toLocaleString()} members</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          disabled={isLoading}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all flex items-center gap-2"
          style={{
            background: isJoined 
              ? 'rgba(255, 255, 255, 0.1)' 
              : `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
            border: isJoined ? `1px solid ${coral}` : 'none',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          {isLoading ? (
            "..."
          ) : isJoined ? (
            <>
              <Check className="w-4 h-4" /> Joined
            </>
          ) : (
            "Join Crew"
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Crew;
