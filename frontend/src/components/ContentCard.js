import React, { useState, useEffect } from "react";
import { Star, Play, ExternalLink, Heart, Share2, MessageCircle } from "lucide-react";
import { FaYoutube, FaReddit } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";

const ContentCard = ({ content, currentUser, onContentClick }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(content.likes || 0);
  const [localShares, setLocalShares] = useState(content.shares || 0);

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
      toast.error("Please create a profile to share content!");
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
        setLocalShares(localShares + 1);
        toast.success(`+${data.points_earned} points! 🎉 Content shared!`);
      }
    } catch (error) {
      toast.error("Failed to share content");
    }
  };

  const handleDiscuss = (e) => {
    e.stopPropagation();
    if (onContentClick) {
      onContentClick(content);
    }
  };

  return (
    <div className="content-card glass-card overflow-hidden group" data-testid={`content-card-${content.id}`}>
      {/* Thumbnail */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Overlay Icons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <div className="rating-badge">
            <Star className="w-4 h-4 fill-current" />
            <span>{content.rating}</span>
          </div>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-[#ff6b35] flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4 space-y-3">
        {/* Title & Platform */}
        <div>
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {content.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`platform-badge ${getPlatformClass(content.platform)}`}>
              {content.platform}
            </span>
          </div>
        </div>

        {/* Tagline */}
        {content.tagline && (
          <p className="text-sm text-gray-400 italic line-clamp-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            "{content.tagline}"
          </p>
        )}

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          {content.description}
        </p>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
              isLiked
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-red-500'
            }`}
            data-testid={`like-button-${content.id}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">{localLikes}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-[#ff6b35] transition-all"
            data-testid={`share-button-${content.id}`}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium">{localShares}</span>
          </button>

          <button
            onClick={handleDiscuss}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-blue-500 transition-all"
            data-testid={`discuss-button-${content.id}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Discuss</span>
          </button>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/5">
          <span className="text-xs text-gray-500 font-medium">Buzz:</span>
          <div className="flex gap-2">
            {content.social_links?.youtube && (
              <a
                href={content.social_links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                data-testid={`social-youtube-${content.id}`}
              >
                <FaYoutube className="w-4 h-4 text-red-500" />
              </a>
            )}
            {content.social_links?.twitter && (
              <a
                href={content.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                data-testid={`social-twitter-${content.id}`}
              >
                <FaXTwitter className="w-4 h-4 text-white" />
              </a>
            )}
            {content.social_links?.reddit && (
              <a
                href={content.social_links.reddit}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center hover:bg-orange-500/30 transition-colors"
                data-testid={`social-reddit-${content.id}`}
              >
                <FaReddit className="w-4 h-4 text-orange-500" />
              </a>
            )}
          </div>
        </div>

        {/* Watch Now Button */}
        <button className="w-full mt-3 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ffa500] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#ff6b35]/30 transition-all" data-testid={`watch-now-${content.id}`}>
          <span>Watch Now</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ContentCard;