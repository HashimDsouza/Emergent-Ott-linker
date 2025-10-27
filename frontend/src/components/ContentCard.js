import React, { useState, useEffect } from "react";
import { Star, Heart, Share2, MessageCircle, Play } from "lucide-react";
import { toast } from "sonner";

const ContentCard = ({ content, currentUser, onContentClick, compact = false }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(content.likes || 0);

  useEffect(() => {
    if (currentUser && currentUser.liked_content) {
      setIsLiked(currentUser.liked_content.includes(content.id));
    }
  }, [currentUser, content.id]);

  const getPlatformClass = (platform) => {
    const platformLower = platform.toLowerCase().replace(/\s+/g, '');
    if (platformLower.includes('netflix')) return 'platform-netflix';
    if (platformLower.includes('prime')) return 'platform-prime';
    if (platformLower.includes('jiohotstar') || platformLower.includes('hotstar')) return 'platform-jiohotstar';
    if (platformLower.includes('sonyliv') || platformLower.includes('sony')) return 'platform-sonyliv';
    if (platformLower.includes('apple')) return 'platform-appletv';
    if (platformLower.includes('mx')) return 'platform-mx';
    return 'platform-appletv';
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please create a profile to like content!");
      return;
    }

    if (isLiked) {
      toast.info("You've already liked this!");
      return;
    }

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/content/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          content_id: content.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        setIsLiked(true);
        setLocalLikes(localLikes + 1);
        toast.success(`+${data.points_earned} points! 🎉`);
      }
    } catch (error) {
      toast.error("Failed to like content");
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please create a profile to share!");
      return;
    }

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/content/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          content_id: content.id,
          platform: 'general'
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`+${data.points_earned} points! 🎉`);
      }
    } catch (error) {
      toast.error("Failed to share");
    }
  };

  const handleDiscuss = (e) => {
    e.stopPropagation();
    if (onContentClick) {
      onContentClick(content);
    }
  };

  if (compact) {
    // Compact view for grid layout (3x2)
    return (
      <div className="content-card glass-card overflow-hidden group rounded-xl" data-testid={`content-card-${content.id}`}>
        {/* Thumbnail */}
        <div className="relative h-32 sm:h-40 overflow-hidden">
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Rating Badge */}
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
              <Star className="w-3 h-3 text-[#ffa500] fill-current" />
              <span className="text-xs font-bold text-white">{content.rating}</span>
            </div>
          </div>

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-10 h-10 rounded-full bg-[#ff6b35] flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="p-2 sm:p-3 space-y-2">
          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {content.title}
          </h3>
          
          {/* Platform Badge */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getPlatformClass(content.platform)}`}>
              {content.platform}
            </span>
          </div>

          {/* Engagement - Compact */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                isLiked
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-white/5 text-gray-400 hover:text-red-500'
              }`}
              data-testid={`like-button-${content.id}`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{localLikes > 999 ? `${(localLikes/1000).toFixed(1)}k` : localLikes}</span>
            </button>

            <button
              onClick={handleDiscuss}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-gray-400 hover:text-blue-500 transition-all text-xs"
              data-testid={`discuss-button-${content.id}`}
            >
              <MessageCircle className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular view for modal/detailed view
  return (
    <div className="content-card glass-card overflow-hidden group rounded-xl" data-testid={`content-card-${content.id}`}>
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="absolute top-3 right-3">
          <div className="rating-badge">
            <Star className="w-4 h-4 fill-current" />
            <span>{content.rating}</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-[#ff6b35] flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-base font-bold text-white mb-2 line-clamp-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {content.title}
          </h3>
          <span className={`platform-badge ${getPlatformClass(content.platform)}`}>
            {content.platform}
          </span>
        </div>

        {content.tagline && (
          <p className="text-xs text-gray-400 italic line-clamp-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            "{content.tagline}"
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all text-sm ${
              isLiked
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-red-500'
            }`}
            data-testid={`like-button-${content.id}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{localLikes}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-[#ff6b35] transition-all text-sm"
            data-testid={`share-button-${content.id}`}
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDiscuss}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-blue-500 transition-all text-sm"
            data-testid={`discuss-button-${content.id}`}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;