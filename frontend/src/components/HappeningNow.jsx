import React, { useState, useEffect } from 'react';

/**
 * HappeningNow Component - Phase A (MVP)
 * 
 * Features:
 * - Hero LIVE section with animated badge and countdown
 * - Tabbed grid for Today's Schedule (All, Sports, Premieres, Events)
 * - Mock data for time-sensitive content
 * - Mobile-first responsive design
 */

export default function HappeningNow({ onInfo, onShare }) {
  const [activeTab, setActiveTab] = useState('all');
  const [timeLeft, setTimeLeft] = useState('');

  // Mock data for hero live item
  const heroItem = {
    id: 'hero-live-1',
    title: 'India vs Australia - Border-Gavaskar Trophy',
    description: 'Final day of the 3rd Test. India needs 120 runs with 6 wickets in hand.',
    platform: 'Jiohotstar',
    thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&h=675&fit=crop&q=80',
    category: 'sports',
    isLive: true,
    startTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    urgentCopy: "Don't miss the thrilling finish!",
    deeplink: 'https://www.hotstar.com/in/sports/cricket',
    categoryEmoji: '🏏'
  };

  // Mock data for grid items
  const allScheduleItems = [
    {
      id: 'schedule-1',
      title: 'Liverpool vs Manchester City',
      platform: 'Jiohotstar',
      thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop&q=80',
      time: '3:00 PM',
      category: 'sports',
      categoryEmoji: '⚽',
      deeplink: 'https://www.hotstar.com/in/sports/football'
    },
    {
      id: 'schedule-2',
      title: 'Yellowstone S5 Finale',
      platform: 'Prime Video',
      thumbnail: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&h=400&fit=crop&q=80',
      time: '5:30 PM',
      category: 'premieres',
      categoryEmoji: '📺',
      deeplink: 'https://www.primevideo.com'
    },
    {
      id: 'schedule-3',
      title: 'Grammy Awards 2025',
      platform: 'Sony Liv',
      thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop&q=80',
      time: '8:00 PM',
      category: 'events',
      categoryEmoji: '🎬',
      deeplink: 'https://www.sonyliv.com'
    },
    {
      id: 'schedule-4',
      title: 'IPL 2025: MI vs CSK',
      platform: 'Jiohotstar',
      thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=400&fit=crop&q=80',
      time: '7:30 PM',
      category: 'sports',
      categoryEmoji: '🏏',
      deeplink: 'https://www.hotstar.com/in/sports/cricket'
    },
    {
      id: 'schedule-5',
      title: 'The Last of Us S2E1',
      platform: 'Jiohotstar',
      thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop&q=80',
      time: '6:00 PM',
      category: 'premieres',
      categoryEmoji: '📺',
      deeplink: 'https://www.hotstar.com'
    },
    {
      id: 'schedule-6',
      title: 'NBA Finals Game 7',
      platform: 'Sony Liv',
      thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop&q=80',
      time: '4:30 PM',
      category: 'sports',
      categoryEmoji: '🏀',
      deeplink: 'https://www.sonyliv.com/sports'
    }
  ];

  // Filter items based on active tab
  const filteredItems = activeTab === 'all' 
    ? allScheduleItems 
    : allScheduleItems.filter(item => item.category === activeTab);

  // Countdown timer logic
  useEffect(() => {
    if (heroItem.isLive) {
      setTimeLeft('LIVE NOW');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = heroItem.startTime - now;
      
      if (diff <= 0) {
        setTimeLeft('LIVE NOW');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        setTimeLeft(`Starting in ${hours}h ${minutes % 60}m`);
      } else {
        setTimeLeft(`Starting in ${minutes} min`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [heroItem.isLive, heroItem.startTime]);

  const tabs = [
    { id: 'all', label: 'All', emoji: '🔥' },
    { id: 'sports', label: 'Sports', emoji: '🏏' },
    { id: 'premieres', label: 'Premieres', emoji: '📺' },
    { id: 'events', label: 'Events', emoji: '🎬' }
  ];

  return (
    <div className="mb-6 md:mb-8">
      {/* Hero LIVE Section */}
      <div className="relative rounded-2xl overflow-hidden mb-6 group cursor-pointer transition-transform hover:scale-[1.01]"
           onClick={() => window.open(heroItem.deeplink, '_blank')}>
        {/* Background Image with Gradient Overlay */}
        <div className="relative w-full aspect-video md:aspect-[21/9]">
          <img 
            src={heroItem.thumbnail} 
            alt={heroItem.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay - stronger at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        </div>

        {/* HAPPENING NOW Badge with Pulse Animation */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-coral-500 px-3 py-1.5 rounded-full animate-pulse-subtle">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white text-xs md:text-sm font-bold uppercase tracking-wide">
            HAPPENING NOW
          </span>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          {/* LIMITED TIME label */}
          <div className="inline-block bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full mb-2">
            <span className="text-white text-xs md:text-sm font-semibold uppercase">
              {heroItem.isLive ? 'LIVE NOW' : 'LIMITED TIME'}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 leading-tight">
            {heroItem.title}
          </h2>

          {/* Description */}
          <p className="text-white/90 text-sm md:text-base mb-3 md:mb-4 max-w-2xl">
            {heroItem.description}
          </p>

          {/* Bottom Row: Urgent Copy + Platform + CTA */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              {/* Countdown/Live Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-coral-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-sm md:text-base">
                  {timeLeft}
                </span>
              </div>
              {/* Platform */}
              <span className="text-mint-400 text-xs md:text-sm font-medium">
                {heroItem.platform}
              </span>
            </div>

            {/* Watch Now CTA */}
            <button 
              className="bg-coral-500 hover:bg-coral-600 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold text-sm md:text-base transition-all transform hover:scale-105 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                window.open(heroItem.deeplink, '_blank');
              }}
            >
              Watch Now
            </button>
          </div>

          {/* Urgent Copy */}
          <p className="text-white/80 text-xs md:text-sm mt-2 italic">
            {heroItem.urgentCopy}
          </p>
        </div>
      </div>

      {/* Today's Schedule Section */}
      <div>
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📅</span>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Today's Schedule
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-coral-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {filteredItems.map((item, index) => (
            <div 
              key={item.id}
              className="relative rounded-xl overflow-hidden group cursor-pointer transition-transform hover:scale-105"
              style={{
                animation: `fadeInStagger 0.3s ease-out ${index * 0.1}s both`
              }}
              onClick={() => window.open(item.deeplink, '_blank')}
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-[3/4]">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {/* Time Badge - Top Left */}
              <div className="absolute top-2 left-2 bg-coral-500 px-3 py-1 rounded-full">
                <span className="text-white text-xs md:text-sm font-bold">
                  {item.time}
                </span>
              </div>

              {/* Category Emoji - Top Right */}
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center">
                <span className="text-lg">{item.categoryEmoji}</span>
              </div>

              {/* Platform Logo - Bottom Left */}
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded">
                <span className="text-mint-400 text-xs font-medium">
                  {item.platform}
                </span>
              </div>

              {/* Title - Bottom with gradient bg */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 pt-8">
                <h4 className="text-white text-xs md:text-sm font-semibold line-clamp-2">
                  {item.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInStagger {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
