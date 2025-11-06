import React from 'react';
import { bigMomentsVideos, getYouTubeWatchUrl } from '../config/bigMomentsConfig';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

export default function BigMomentsTray() {
  const handleVideoClick = (videoId) => {
    // Open YouTube video in new tab
    window.open(getYouTubeWatchUrl(videoId), '_blank');
  };

  return (
    <div className="px-3 md:px-6 pb-6 md:pb-8">
      <div className="max-w-[1280px] mx-auto">
        {/* Tray Header */}
        <div className="mb-3 md:mb-4">
          <h2 
            className="text-lg md:text-xl font-bold flex items-center gap-2"
            style={{ color: mint }}
          >
            <span>⚡</span>
            BIG MOMENTS
          </h2>
          <p className="text-xs md:text-sm text-white/60 mt-1">
            Trending viral sports clips
          </p>
        </div>

        {/* Video Tiles - Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3 md:gap-3" style={{ width: 'max-content' }}>
            {bigMomentsVideos.map((video) => (
              <VideoTile 
                key={video.id} 
                video={video}
                onClick={() => handleVideoClick(video.videoId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollbar Hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function VideoTile({ video, onClick }) {
  return (
    <div
      onClick={onClick}
      className="snap-start flex-shrink-0 w-[180px] md:w-[180px] cursor-pointer group transition-all hover:scale-[1.02]"
    >
      {/* Video Thumbnail */}
      <div 
        className="relative rounded-xl overflow-hidden mb-2"
        style={{ 
          aspectRatio: '16/9',
          backgroundColor: charcoalSoft 
        }}
      >
        <img 
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if maxresdefault doesn't exist
            e.target.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
          }}
        />
        
        {/* Play Button Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all"
        >
          <div 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
            style={{ 
              backgroundColor: coral,
              boxShadow: `0 4px 12px ${coral}60`
            }}
          >
            <span className="text-white text-xl md:text-2xl ml-1">▶</span>
          </div>
        </div>

        {/* Views Badge */}
        <div 
          className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{ 
            backgroundColor: `${charcoal}E0`,
            color: mint 
          }}
        >
          👁️ {video.views}
        </div>
      </div>

      {/* Video Info */}
      <div className="px-1">
        {/* Sport Badge */}
        <div 
          className="inline-block px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-semibold mb-1"
          style={{ 
            backgroundColor: `${mint}20`,
            color: mint,
            border: `1px solid ${mint}40`
          }}
        >
          {video.league}
        </div>

        {/* Title */}
        <h3 
          className="text-xs md:text-sm font-semibold text-white line-clamp-2 mb-1"
          style={{ minHeight: '32px' }}
        >
          {video.title}
        </h3>

        {/* Descriptor */}
        <p 
          className="text-[10px] md:text-xs italic line-clamp-1"
          style={{ color: coral }}
        >
          {video.descriptor}
        </p>

        {/* Upload Info */}
        <p className="text-[9px] md:text-[10px] text-white/50 mt-1">
          {video.uploadedAgo}
        </p>
      </div>
    </div>
  );
}
