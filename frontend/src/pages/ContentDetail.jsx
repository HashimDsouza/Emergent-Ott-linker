import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import { ArrowLeft, Info, Share2 } from "lucide-react";
import ShareModal from "../components/ShareModal";
import DetailsModal from "../components/DetailsModal";
import { mapApiToCard } from "../utils/mapApiToCard";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

const ContentDetail = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [contentId]);

  const fetchContent = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://crew-discovery.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/content`);
      const allContent = await response.json();
      
      // Find the specific content and map to card format
      const foundContent = allContent.find(item => item.id === contentId);
      
      if (foundContent) {
        // Use the same mapping as tiles
        const mappedContent = mapApiToCard(foundContent);
        setContent(mappedContent);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching content:", error);
      setLoading(false);
    }
  };

  const handlePosterClick = () => {
    if (!content || !content.platform) return;
    
    // Open the streaming platform directly
    const platform = content.platform.toLowerCase();
    
    if (platform.includes('netflix')) {
      window.open(`https://www.netflix.com/search?q=${encodeURIComponent(content.title)}`, '_blank');
    } else if (platform.includes('prime')) {
      window.open(`https://www.primevideo.com/search?phrase=${encodeURIComponent(content.title)}`, '_blank');
    } else if (platform.includes('hotstar') || platform.includes('jiohotstar')) {
      window.open(`https://www.hotstar.com/in/search?q=${encodeURIComponent(content.title)}`, '_blank');
    } else if (platform.includes('sony')) {
      window.open(`https://www.sonyliv.com/search/${encodeURIComponent(content.title)}`, '_blank');
    } else if (platform.includes('zee')) {
      window.open(`https://www.zee5.com/search?q=${encodeURIComponent(content.title)}`, '_blank');
    } else if (platform.includes('apple')) {
      window.open(`https://tv.apple.com/search?q=${encodeURIComponent(content.title)}`, '_blank');
    } else {
      window.open(`https://www.google.com/search?q=watch+${encodeURIComponent(content.title)}+on+${encodeURIComponent(content.platform)}`, '_blank');
    }
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

  if (!content) {
    return (
      <>
        <ConnectorHeader />
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: charcoal }}>
          <div className="text-white text-xl mb-4">Content not found</div>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-full text-white font-semibold"
            style={{ background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` }}
          >
            Go to Home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <ConnectorHeader />
      <div className="min-h-screen pb-32" style={{ backgroundColor: charcoal }}>
        {/* Back Button */}
        <div className="px-3 md:px-6 pt-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
        </div>

        {/* Content Tile - Match exact Tile visual identity */}
        <div className="px-3 md:px-6 pt-6 pb-8">
          <div className="max-w-md mx-auto">
            {/* Tile Container - Exact same as Tile component */}
            <div className="relative block rounded-lg md:rounded-xl overflow-hidden shadow-lg border border-white/10 group">
              {/* Poster - 2:3 aspect ratio (portrait) - CLICKABLE */}
              <div 
                onClick={handlePosterClick}
                className="relative cursor-pointer" 
                style={{ background: `linear-gradient(135deg, ${coral}70 0%, ${mint}45 45%, ${charcoalSoft} 100%)` }}
              >
                {/* Share Icon - Top Right Corner */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareModalOpen(true);
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 md:w-7 md:h-7 rounded-full backdrop-blur-xl transition-all transform hover:scale-110 flex items-center justify-center"
                  style={{
                    background: 'rgba(14, 21, 20, 0.75)',
                    border: `1px solid ${mint}40`,
                    boxShadow: `0 0 12px ${mint}20`,
                    opacity: 0.85
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.boxShadow = `0 0 20px ${mint}50`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                    e.currentTarget.style.boxShadow = `0 0 12px ${mint}20`;
                  }}
                >
                  <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: mint }} />
                </button>

                <div className="aspect-[2/3]">
                  {content.thumbnail && (
                    <img 
                      src={content.thumbnail} 
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Info Section - Exact 4-line format */}
              <div className="p-2 md:p-3" style={{ background: charcoal }}>
                {/* Line 1: Title */}
                <h2 className="text-xs md:text-sm font-bold text-white truncate mb-0.5">
                  {content.title}
                </h2>

                {/* Line 2: Platform + Social Icons */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] md:text-xs font-semibold truncate" style={{ color: mint }}>
                    {content.platform}
                  </span>
                  {content.social_links && (
                    <div className="flex items-center gap-1 ml-auto">
                      {content.social_links.youtube && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(content.social_links.youtube, '_blank');
                          }}
                          className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <span className="text-[10px]">📺</span>
                        </button>
                      )}
                      {content.social_links.twitter && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(content.social_links.twitter, '_blank');
                          }}
                          className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <span className="text-[10px]">🐦</span>
                        </button>
                      )}
                      {content.social_links.reddit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(content.social_links.reddit, '_blank');
                          }}
                          className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <span className="text-[10px]">🤖</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Line 3: Buzz with icons */}
                <div className="text-[9px] md:text-[10px] italic mb-0.5" style={{ color: coral }}>
                  {content.imdb && `⭐ ${content.imdb}`}
                  {content.imdb && content.category && " • "}
                  {content.category}
                </div>

                {/* Line 4: Descriptor (left) + 'i' icon (right) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] md:text-[10px] text-white/75 truncate flex-1">
                    {content.descriptor}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailModalOpen(true);
                    }}
                    className="flex-shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ 
                      background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                      boxShadow: `0 0 6px ${mint}40`
                    }}
                  >
                    <Info className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Helper text */}
            <p className="text-center text-xs text-gray-400 mt-4">
              Tap poster to watch • Tap 'i' for details
            </p>
          </div>
        </div>
      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
      
      {/* Modals */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        content={content}
      />
      <DetailsModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        item={content}
      />
    </>
  );
};

export default ContentDetail;
