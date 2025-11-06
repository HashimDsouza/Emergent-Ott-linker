import React from 'react';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

const mockBestOf = [
  { id: 1, videoId: 'best1', title: 'Best Of IPL 2024', sport: 'cricket', views: '5.2M', descriptor: 'Season best moments.' },
  { id: 2, videoId: 'best2', title: 'Premier League Top 10', sport: 'football', views: '3.8M', descriptor: 'Goals of the season.' },
  { id: 3, videoId: 'best3', title: 'NBA Dunks November', sport: 'nba', views: '2.1M', descriptor: 'Rim-wrecking slams.' },
  { id: 4, videoId: 'best4', title: 'Grand Slam Best Rallies', sport: 'tennis', views: '1.9M', descriptor: 'Epic exchanges.' },
  { id: 5, videoId: 'best5', title: 'F1 Overtakes 2024', sport: 'f1', views: '4.5M', descriptor: 'Wheel-to-wheel action.' },
  { id: 6, videoId: 'best6', title: 'Cricket Best Catches', sport: 'cricket', views: '6.3M', descriptor: 'Defying gravity.' }
];

export default function BestOfTray() {
  return (
    <div className="px-3 md:px-6 pb-12 md:pb-16" style={{ backgroundColor: charcoal }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2" style={{ color: mint }}>
            <span>👑</span>
            BEST OF
          </h2>
          <p className="text-xs md:text-sm text-white/60 mt-1">Greatest moments curated</p>
        </div>
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {mockBestOf.map((video) => (
              <div key={video.id} className="snap-start flex-shrink-0 w-[180px] cursor-pointer group" onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}>
                <div className="relative rounded-xl overflow-hidden mb-2" style={{ aspectRatio: '16/9', backgroundColor: charcoalSoft }}>
                  <img src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${coral}E0` }}>
                      <span className="text-white text-sm ml-0.5">▶</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${charcoal}E0`, color: mint }}>👁️ {video.views}</div>
                </div>
                <div className="px-1">
                  <h3 className="text-xs font-semibold text-white line-clamp-2 mb-1">{video.title}</h3>
                  <p className="text-[10px] italic line-clamp-1" style={{ color: coral }}>{video.descriptor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{".scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }"}</style>
    </div>
  );
}