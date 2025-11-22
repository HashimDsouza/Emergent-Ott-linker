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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://traymgr.preview.emergentagent.com";
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
        <div className="min-h-screen pb-32" style={{ backgroundColor: charcoal }}>
          <div className="px-3 md:px-6 pt-4">
            <div className="h-4 w-24 rounded animate-pulse" style={{ background: `${mint}30` }} />
          </div>
          <div className="px-3 md:px-6 pt-6 pb-8">
            <div className="max-w-md mx-auto">
              {/* Skeleton Tile */}
              <div className="relative block rounded-lg md:rounded-xl overflow-hidden shadow-lg border border-white/10">
                <div className="aspect-[2/3] animate-pulse" style={{ background: `linear-gradient(135deg, ${coral}30 0%, ${mint}20 100%)` }}>
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/10" />
                </div>
                <div className="p-2 md:p-3">
                  <div className="h-4 w-3/4 rounded mb-2 animate-pulse bg-white/10" />
                  <div className="h-3 w-1/2 rounded mb-2 animate-pulse bg-white/10" />
                  <div className="h-3 w-2/3 rounded mb-2 animate-pulse bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-1/3 rounded animate-pulse bg-white/10" />
                    <div className="w-4 h-4 rounded-full animate-pulse bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ConnectorFooter />
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

  // Related Content Component
  const RelatedContent = ({ currentContent }) => {
    const [relatedItems, setRelatedItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchRelatedContent();
    }, [currentContent]);

    const fetchRelatedContent = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://traymgr.preview.emergentagent.com";
        const response = await fetch(`${backendUrl}/api/content`);
        const allContent = await response.json();
        
        // Filter related content (same platform or category, exclude current)
        const related = allContent
          .filter(item => 
            item.id !== currentContent.id && 
            (item.platform === currentContent.platform || item.category === currentContent.category)
          )
          .slice(0, 6)
          .map(item => mapApiToCard(item));
        
        setRelatedItems(related);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching related content:", error);
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-32 md:w-40">
              <div className="aspect-[2/3] rounded-xl animate-pulse" style={{ background: `${coral}20` }} />
            </div>
          ))}
        </div>
      );
    }

    if (relatedItems.length === 0) return null;

    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {relatedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/content/${item.id}`)}
            className="flex-shrink-0 w-32 md:w-40 group"
          >
            <div className="relative rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
              <div className="aspect-[2/3] relative">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${coral}30 0%, ${mint}20 100%)` }}>
                    <span className="text-4xl">🎬</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-xs text-white font-bold line-clamp-2">{item.title}</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

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

              {/* Info Section - EXACT 4-line format matching Tile.jsx */}
              <div className="p-2 md:p-3" style={{ background: charcoal }}>
                {/* Line 1: Title + Social Engagement Icons */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h2 className="text-xs md:text-sm font-bold text-white truncate flex-1">
                    {content.title}
                  </h2>
                  {/* Social Engagement Icons (right side) */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 opacity-90 text-[8px] md:text-xs hover:scale-110 transition"
                    >
                      <span>❤️</span>
                      <span>{Math.floor(Math.random() * 500) + 100}</span>
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 opacity-90 text-[8px] md:text-xs hover:scale-110 transition"
                    >
                      <span>👍</span>
                      <span>{Math.floor(Math.random() * 400) + 80}</span>
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 opacity-90 text-[8px] md:text-xs hover:scale-110 transition"
                    >
                      <span>💬</span>
                      <span>{Math.floor(Math.random() * 300) + 50}</span>
                    </button>
                  </div>
                </div>

                {/* Line 2: Platform */}
                <div className="text-[10px] md:text-xs font-semibold truncate mb-1 md:mb-1" style={{ color: mint }}>
                  {content.platform}
                </div>

                {/* Line 3: BUZZ METER + social icons (YouTube, Twitter, Reddit) + IMDb rating - EXACT MATCH */}
                <div className="flex items-center gap-1 md:gap-1.5 uppercase tracking-wide opacity-85 mb-1 md:mb-1 text-[9px] md:text-[10px]">
                  <span className="md:hidden">BUZZ</span>
                  <span className="hidden md:inline">BUZZ METER</span>
                  <a 
                    href={content.buzz?.yt || `https://www.youtube.com/results?search_query=${encodeURIComponent((content.title || 'trending') + ' trailer')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="10" height="10" className="md:w-[14px] md:h-[14px]" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41.6 41.6 0 0 0 0 12a41.6 41.6 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41.6 41.6 0 0 0 24 12a41.6 41.6 0 0 0-.5-5.8Z"/><path fill="#fff" d="m10 15 6-3-6-3v6z"/></svg>
                  </a>
                  <a 
                    href={content.buzz?.x || `https://twitter.com/search?q=${encodeURIComponent(content.title || 'trending')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="10" height="10" className="md:w-[14px] md:h-[14px]" viewBox="0 0 24 24"><path fill="#ffffff" d="M18.146 2H21l-6.5 7.43L22.5 22h-6.59l-5.16-6.64L4.7 22H2l6.97-7.97L1.5 2H8.09l4.66 6L18.146 2Zm-2.31 18.5h1.71L7.25 3.46H5.43l10.41 17.04Z"/></svg>
                  </a>
                  <a 
                    href={content.buzz?.reddit || `https://www.reddit.com/search/?q=${encodeURIComponent(content.title || 'trending')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="10" height="10" className="md:w-[14px] md:h-[14px]" viewBox="0 0 24 24"><path fill="#FF4500" d="M22 12.07c0-1.2-.98-2.18-2.18-2.18-.56 0-1.07.21-1.45.55-1.44-.94-3.23-1.54-5.2-1.61l1.11-3.51 3.06.72a1.64 1.64 0 1 0 .19-1.1l-3.6-.85a.7.7 0 0 0-.84.46l-1.4 4.42c-1.97.05-3.76.64-5.21 1.58a2.18 2.18 0 1 0-2.64 3.45c-.05.24-.08.49-.08.74 0 2.87 3.58 5.2 8 5.2s8-2.33 8-5.2c0-.25-.03-.5-.09-.74.5-.4.84-1 .84-1.73Z"/></svg>
                  </a>
                  {content.imdb && content.imdb_id && (
                    <a 
                      href={`https://www.imdb.com/title/${content.imdb_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[9px] md:text-[10px] font-semibold flex-shrink-0 ml-0.5 hover:opacity-80 transition"
                      style={{ color: '#fbbf24' }}
                    >
                      ⭐ {typeof content.imdb === 'number' ? content.imdb.toFixed(1) : content.imdb}
                    </a>
                  )}
                  {content.imdb && !content.imdb_id && (
                    <span className="text-[9px] md:text-[10px] font-semibold flex-shrink-0 ml-0.5" style={{ color: '#fbbf24' }}>
                      ⭐ {typeof content.imdb === 'number' ? content.imdb.toFixed(1) : content.imdb}
                    </span>
                  )}
                </div>

                {/* Line 4: Descriptor (left) + 'i' icon (right) */}
                <div className="flex items-center gap-1 md:gap-1.5">
                  <div 
                    className="italic flex-1 text-[11px] md:text-[12px] leading-tight"
                    style={{ color: coral }}
                  >
                    {content.descriptor}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailModalOpen(true);
                    }}
                    className="flex-shrink-0 w-3.5 h-3.5 md:w-[14px] md:h-[14px] rounded-full flex items-center justify-center transition-all hover:scale-110"
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

          </div>

          {/* Related Content Section */}
          <div className="mt-8 md:mt-12">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span style={{ color: coral }}>✨</span> More Like This
            </h3>
            <RelatedContent currentContent={content} />
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
