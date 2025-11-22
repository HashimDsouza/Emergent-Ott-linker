import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Share2, Copy, CheckCircle } from "lucide-react";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const ShareModal = ({ isOpen, onClose, content }) => {
  const [myCrews, setMyCrews] = useState([]);
  const [selectedCrews, setSelectedCrews] = useState([]);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyCrews();
    }
  }, [isOpen]);

  const fetchMyCrews = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/crew/my-crews?user_id=anonymous`);
      const data = await response.json();
      setMyCrews(data);
    } catch (error) {
      console.error("Error fetching crews:", error);
    }
  };

  const toggleCrewSelection = (crewId) => {
    setSelectedCrews(prev =>
      prev.includes(crewId)
        ? prev.filter(id => id !== crewId)
        : [...prev, crewId]
    );
  };

  const handleShareToCrews = async () => {
    if (selectedCrews.length === 0) return;
    
    setSharing(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      
      // Add to watchlist with crew sharing
      await fetch(`${backendUrl}/api/watchlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "anonymous",
          content_id: content.id,
          content_type: content.category || "movie",
          content_title: content.title,
          content_image: content.thumbnail,
          status: "want_to_watch",
          shared_with_crews: selectedCrews
        })
      });
      
      // Success feedback
      setTimeout(() => {
        setSharing(false);
        onClose();
        setSelectedCrews([]);
      }, 500);
    } catch (error) {
      console.error("Error sharing to crews:", error);
      setSharing(false);
    }
  };

  const handleSocialShare = async (platform) => {
    // Use current preview URL (automatically updates with each fork)
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://viewflow-enhance.preview.emergentagent.com';
    const shareUrl = `${currentUrl}/content/${content.id}`;
    
    // Randomize between the two copy options
    const copyOptions = [
      `You'll love this one: ${content.title}.`,
      `Found something you would like: ${content.title}.`
    ];
    const shareText = copyOptions[Math.floor(Math.random() * copyOptions.length)];

    if (platform === "native" && navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    }
  };

  const handleCopyLink = () => {
    // Use current preview URL (automatically updates with each fork)
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://viewflow-enhance.preview.emergentagent.com';
    const shareUrl = `${currentUrl}/content/${content.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full md:w-auto md:min-w-[500px] bg-charcoal rounded-t-3xl md:rounded-3xl border border-white/20 overflow-hidden max-h-[90vh] flex flex-col"
          style={{ backgroundColor: charcoal }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5" style={{ color: mint }} />
              <h2 className="text-xl font-bold text-white">Share "{content.title}"</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Share to Crews Section */}
            <div>
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <span>🎯</span> Share to My Crews
              </h3>
              
              {myCrews.length === 0 ? (
                <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400">You haven't joined any crews yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {myCrews.map((crew) => (
                    <button
                      key={crew.id}
                      onClick={() => toggleCrewSelection(crew.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border transition-all"
                      style={{
                        background: selectedCrews.includes(crew.id) ? `${mint}20` : 'rgba(255, 255, 255, 0.05)',
                        borderColor: selectedCrews.includes(crew.id) ? mint : 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{crew.name === "Regional Riders" ? "🇮🇳" : crew.icon}</span>
                        <span className="text-sm font-semibold text-white">{crew.name}</span>
                      </div>
                      {selectedCrews.includes(crew.id) && (
                        <Check className="w-5 h-5" style={{ color: mint }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedCrews.length > 0 && (
                <button
                  onClick={handleShareToCrews}
                  disabled={sharing}
                  className="w-full mt-4 py-3 rounded-full font-bold text-white transition-all transform hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                    opacity: sharing ? 0.7 : 1
                  }}
                >
                  {sharing ? "Sharing..." : `Share to ${selectedCrews.length} Crew${selectedCrews.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Share to Social Section */}
            <div>
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <span>💬</span> Share to Social
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={() => handleSocialShare("whatsapp")}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 hover:bg-[#25D366]/30 transition-all"
                >
                  <span className="text-xl">💬</span>
                  <span className="text-sm font-semibold text-white">WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={() => handleSocialShare("telegram")}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/30 hover:bg-[#0088cc]/30 transition-all"
                >
                  <span className="text-xl">✈️</span>
                  <span className="text-sm font-semibold text-white">Telegram</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/30 hover:bg-[#1877F2]/30 transition-all"
                >
                  <span className="text-xl">📘</span>
                  <span className="text-sm font-semibold text-white">Facebook</span>
                </button>

                {/* Twitter */}
                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/30 transition-all"
                >
                  <span className="text-xl">🐦</span>
                  <span className="text-sm font-semibold text-white">Twitter</span>
                </button>
              </div>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" style={{ color: mint }} />
                    <span className="text-sm font-semibold" style={{ color: mint }}>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-white" />
                    <span className="text-sm font-semibold text-white">Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
