import React, { useState, useEffect } from "react";
import { X, Users, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ShareToCrewModal({ isOpen, onClose, content }) {
  const [crews, setCrews] = useState([]);
  const [selectedCrews, setSelectedCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyCrews();
      setSelectedCrews([]);
      setShareSuccess(false);
    }
  }, [isOpen]);

  const fetchMyCrews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/crew/my-crews?user_id=anonymous`);
      const data = await response.json();
      setCrews(data);
    } catch (error) {
      console.error("Error fetching crews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (selectedCrews.length === 0) return;

    setSharing(true);
    try {
      // Add to each selected crew's watchlist
      for (const crewId of selectedCrews) {
        await fetch(`${BACKEND_URL}/api/watchlist/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: "anonymous",
            content_id: content.id,
            content_type: "movie",
            content_title: content.title,
            content_image: content.thumbnail || content.poster_url,
            shared_with_crews: [crewId],
          }),
        });
      }
      
      setShareSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error sharing to crews:", error);
    } finally {
      setSharing(false);
    }
  };

  const toggleCrew = (crewId) => {
    setSelectedCrews((prev) =>
      prev.includes(crewId)
        ? prev.filter((id) => id !== crewId)
        : [...prev, crewId]
    );
  };

  const filteredCrews = crews.filter((crew) =>
    crew.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl overflow-hidden border"
          style={{
            background: charcoal,
            borderColor: "rgba(48, 224, 178, 0.3)",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: mint }} />
              <h3 className="text-lg font-bold text-white">Share to Crew</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content Preview */}
          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
            <div className="flex items-center gap-3">
              {content.thumbnail && (
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-12 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-white line-clamp-2">
                  {content.title}
                </p>
                <p className="text-xs opacity-60 text-white mt-1">
                  {content.platform}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Search crews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-mint/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Crews List */}
          <div className="px-6 py-4 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredCrews.length === 0 ? (
              <p className="text-center text-white/60 text-sm py-8">
                {searchQuery ? "No crews found" : "You haven't joined any crews yet"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredCrews.map((crew) => (
                  <button
                    key={crew.id}
                    onClick={() => toggleCrew(crew.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border transition-all"
                    style={{
                      background: selectedCrews.includes(crew.id)
                        ? "rgba(48, 224, 178, 0.1)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderColor: selectedCrews.includes(crew.id)
                        ? mint
                        : "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{crew.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{crew.name}</p>
                        <p className="text-xs text-white/60">
                          {crew.member_count?.toLocaleString() || 0} members
                        </p>
                      </div>
                    </div>
                    {selectedCrews.includes(crew.id) && (
                      <Check className="w-5 h-5" style={{ color: mint }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <p className="text-xs text-white/60">
              {selectedCrews.length} crew{selectedCrews.length !== 1 ? "s" : ""} selected
            </p>
            <button
              onClick={handleShare}
              disabled={selectedCrews.length === 0 || sharing || shareSuccess}
              className="px-6 py-2 rounded-full font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background:
                  shareSuccess
                    ? mint
                    : selectedCrews.length === 0
                    ? "rgba(255, 255, 255, 0.1)"
                    : `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                color: "white",
              }}
            >
              {shareSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Shared!
                </>
              ) : sharing ? (
                "Sharing..."
              ) : (
                "Share"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
