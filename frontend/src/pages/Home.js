import React, { useEffect, useState } from "react";
import axios from "axios";
import CategorySection from "@/components/CategorySection";
import ChatBot from "@/components/ChatBot";
import { Star, Sparkles } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // First seed the data
      await axios.post(`${API}/content/seed`);
      
      // Then fetch all content
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
    <div className="min-h-screen bg-[#0a0a0f]" data-testid="home-page">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/90 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ffa500] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <span className="gradient-text">The Connector</span>
              </h1>
            </div>
            <p className="hidden sm:block text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your OTT Command Center
            </p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff6b35]/5 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="glass-card p-8 sm:p-12">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-[#ff6b35]" />
              <span className="text-sm font-semibold text-[#ff6b35] uppercase tracking-wider">Top 5 Curated</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Enough Scrolling.
              <br />
              <span className="gradient-text">Start Streaming.</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your daily 5 — what the world's watching, talking, and losing sleep over.
            </p>
          </div>
        </div>
      </section>

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

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ffa500] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>The Connector</span>
            </div>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Connecting you to every OTT in India. One tap at a time.</p>
            <p className="text-xs text-gray-600">© 2025 The Connector. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chat Bot */}
      <ChatBot />
    </div>
  );
};

export default Home;