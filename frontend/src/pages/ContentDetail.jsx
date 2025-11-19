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
      
      // Find the specific content
      const foundContent = allContent.find(item => item.id === contentId);
      
      if (foundContent) {
        setContent(foundContent);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching content:", error);
      setLoading(false);
    }
  };

  const openPlatform = (platform) => {
    if (!content) return;
    
    // Open streaming platform (deeplink or web)
    const platformUrls = {
      'Netflix': `https://www.netflix.com/search?q=${encodeURIComponent(content.title)}`,
      'Prime Video': `https://www.primevideo.com/search?phrase=${encodeURIComponent(content.title)}`,
      'Jiohotstar': `https://www.hotstar.com/in/search?q=${encodeURIComponent(content.title)}`,
      'Disney+ Hotstar': `https://www.hotstar.com/in/search?q=${encodeURIComponent(content.title)}`,
      'Sony Liv': `https://www.sonyliv.com/search/${encodeURIComponent(content.title)}`,
      'Zee5': `https://www.zee5.com/search?q=${encodeURIComponent(content.title)}`,
      'Apple TV+': `https://tv.apple.com/search?q=${encodeURIComponent(content.title)}`,
      'YouTube': content.buzz?.yt || `https://www.youtube.com/results?search_query=${encodeURIComponent(content.title)}`
    };

    const url = platformUrls[platform] || `https://www.google.com/search?q=${encodeURIComponent(content.title + ' ' + platform)}`;
    window.open(url, '_blank');
  };

  const openSocialLink = (platform) => {
    if (!content || !content.buzz) return;
    
    const urls = {
      youtube: content.buzz.yt,
      twitter: content.buzz.x,
      reddit: content.buzz.reddit
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
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

        {/* Content Hero */}
        <div className="px-3 md:px-6 pt-4 md:pt-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-[300px,1fr] gap-6 md:gap-8">
              {/* Poster */}
              <div className="relative overflow-hidden rounded-2xl aspect-[2/3] max-w-[300px] mx-auto md:mx-0">
                {content.thumbnail ? (
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${coral}30 0%, ${mint}20 100%)` }}
                  >
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                    {content.title}
                  </h1>
                  {content.imdb && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded" style={{ background: `${mint}30`, color: mint }}>
                        ⭐ {content.imdb}
                      </span>
                      {content.category && (
                        <span className="text-gray-400">{content.category}</span>
                      )}
                    </div>
                  )}
                </div>

                {content.description && (
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    {content.description}
                  </p>
                )}

                {content.genres && content.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {content.genres.slice(0, 5).map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Watch On Button */}
                {content.platform && (
                  <button
                    onClick={() => openPlatform(content.platform)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all transform hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`,
                      boxShadow: `0 8px 24px ${coral}40`
                    }}
                  >
                    <Play className="w-5 h-5" />
                    Watch on {content.platform}
                  </button>
                )}

                {/* Share Button */}
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white border-2 transition-all"
                  style={{ borderColor: mint, color: mint }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Share with Crew
                </button>

                {/* Social Buzz Links */}
                {content.buzz && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-gray-400 mb-3">Check the Buzz:</p>
                    <div className="flex gap-3">
                      {content.buzz.yt && (
                        <button
                          onClick={() => openSocialLink('youtube')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                          style={{ background: 'rgba(255, 0, 0, 0.2)', border: '1px solid rgba(255, 0, 0, 0.3)' }}
                        >
                          📺 YouTube
                        </button>
                      )}
                      {content.buzz.x && (
                        <button
                          onClick={() => openSocialLink('twitter')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                          style={{ background: 'rgba(29, 161, 242, 0.2)', border: '1px solid rgba(29, 161, 242, 0.3)' }}
                        >
                          🐦 Twitter
                        </button>
                      )}
                      {content.buzz.reddit && (
                        <button
                          onClick={() => openSocialLink('reddit')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                          style={{ background: 'rgba(255, 69, 0, 0.2)', border: '1px solid rgba(255, 69, 0, 0.3)' }}
                        >
                          🤖 Reddit
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        content={content}
      />
    </>
  );
};

export default ContentDetail;
