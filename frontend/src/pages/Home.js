import React, { useEffect, useState } from "react";
import axios from "axios";
import CategorySection from "@/components/CategorySection";
import ChatBot from "@/components/ChatBot";
import HeroCarousel from "@/components/HeroCarousel";
import { Sparkles } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ott");

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      await axios.post(`${API}/content/seed`);
      const response = await axios.get(`${API}/content`);
      setAllContent(response.data);
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getContentByCategory = (category) => {
    return allContent.filter((item) => item.category === category).slice(0, 6);
  };

  const getAllContentByCategory = (category) => {
    return allContent.filter((item) => item.category === category);
  };

  const getTopLaunches = () => {
    return allContent.filter((item) => item.category === "hot_drop").slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24" data-testid="home-page">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/95 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ffa500] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The Connector
            </h1>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <section className="sticky top-[73px] z-30 backdrop-blur-xl bg-[#0a0a0f]/95 border-b border-white/5" data-testid="tab-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab("sports")}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === "sports"
                  ? "bg-gradient-to-r from-[#ff6b35] to-[#ffa500] text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
              data-testid="tab-sports"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Sports
            </button>
            <button
              onClick={() => setActiveTab("ott")}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === "ott"
                  ? "bg-gradient-to-r from-[#ff6b35] to-[#ffa500] text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
              data-testid="tab-ott"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              OTT
            </button>
            <button
              onClick={() => setActiveTab("music")}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === "music"
                  ? "bg-gradient-to-r from-[#ff6b35] to-[#ffa500] text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
              data-testid="tab-music"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Music
            </button>
          </div>
        </div>
      </section>

      {/* Hero Carousel - Big 5 Launches */}
      <HeroCarousel launches={getTopLaunches()} />

      {/* Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        <CategorySection
          title="Buzzing Now"
          emoji="🔥"
          description="Your daily 5 — what the world's watching, talking, and losing sleep over."
          content={getContentByCategory("buzzing")}
          allContent={getAllContentByCategory("buzzing")}
          categoryKey="buzzing"
        />

        <CategorySection
          title="Hot Drop Alert"
          emoji="🚨"
          description="5 new launches that broke the internet."
          content={getContentByCategory("hot_drop")}
          allContent={getAllContentByCategory("hot_drop")}
          categoryKey="hot_drop"
        />

        <CategorySection
          title="Movies"
          emoji="🎬"
          description="Cinema that hits different."
          content={getContentByCategory("movies")}
          allContent={getAllContentByCategory("movies")}
          categoryKey="movies"
        />

        <CategorySection
          title="Series"
          emoji="📺"
          description="Binge-worthy shows you can't pause."
          content={getContentByCategory("series")}
          allContent={getAllContentByCategory("series")}
          categoryKey="series"
        />

        <CategorySection
          title="Sports"
          emoji="⚽"
          description="Game on. Right now."
          content={getContentByCategory("sports")}
          allContent={getAllContentByCategory("sports")}
          categoryKey="sports"
        />

        <CategorySection
          title="Documentaries"
          emoji="🎥"
          description="Real stories, unreal impact."
          content={getContentByCategory("documentaries")}
          allContent={getAllContentByCategory("documentaries")}
          categoryKey="documentaries"
        />

        <CategorySection
          title="Reality"
          emoji="🎭"
          description="Drama. Chaos. Peak entertainment."
          content={getContentByCategory("reality")}
          allContent={getAllContentByCategory("reality")}
          categoryKey="reality"
        />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/95 border-t border-white/5" data-testid="bottom-navigation">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {/* Home */}
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-white hover:text-[#ff6b35] transition-colors" data-testid="nav-home">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </button>

            {/* Genres */}
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-[#ff6b35] transition-colors" data-testid="nav-genres">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs font-medium">Genres</span>
            </button>

            {/* AI Agent - Center with special styling */}
            <button className="flex flex-col items-center gap-1 px-6 py-2 -mt-8 bg-gradient-to-br from-[#ff6b35] to-[#ffa500] rounded-full shadow-lg shadow-[#ff6b35]/30" data-testid="nav-ai-agent">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-white">AI Agent</span>
            </button>

            {/* Explore */}
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-[#ff6b35] transition-colors" data-testid="nav-explore">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs font-medium">Explore</span>
            </button>

            {/* Me */}
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-[#ff6b35] transition-colors" data-testid="nav-me">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium">Me</span>
            </button>
          </div>
        </div>
      </nav>

      {/* AI Chat Bot */}
      <ChatBot />
    </div>
  );
};

export default Home;