import React, { useState, useEffect } from "react";
import axios from "axios";
import CategorySection from "@/components/CategorySection";
import ChatBot from "@/components/ChatBot";
import HeroCarousel from "@/components/HeroCarousel";
import UserProfileModal from "@/components/UserProfileModal";
import LeaderboardModal from "@/components/LeaderboardModal";
import CommunityChat from "@/components/CommunityChat";
import UserProfile from "@/components/UserProfile";
import { Sparkles, Trophy, MessageSquare, User } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ott");
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCommunityChat, setShowCommunityChat] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    loadContent();
    loadUser();
  }, []);

  const loadUser = async () => {
    const storedUser = localStorage.getItem('connector_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Fetch fresh user data
      try {
        const response = await axios.get(`${API}/users/${userData.id}`);
        setCurrentUser(response.data);
        localStorage.setItem('connector_user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Error loading user:', error);
      }
    } else {
      setShowProfileSetup(true);
    }
  };

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

  const handleUserCreated = (user) => {
    setCurrentUser(user);
    localStorage.setItem('connector_user', JSON.stringify(user));
    setShowProfileSetup(false);
  };

  const handleContentClick = (content) => {
    setSelectedContent(content);
    setShowCommunityChat(true);
  };

  const refreshUser = async () => {
    if (currentUser) {
      try {
        const response = await axios.get(`${API}/users/${currentUser.id}`);
        setCurrentUser(response.data);
        localStorage.setItem('connector_user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
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
      <Toaster position="top-center" richColors />
      
      {/* User Profile Setup Modal */}
      {showProfileSetup && (
        <UserProfileModal onUserCreated={handleUserCreated} onClose={() => setShowProfileSetup(false)} />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} currentUser={currentUser} />
      )}

      {/* Community Chat */}
      {showCommunityChat && (
        <CommunityChat 
          content={selectedContent} 
          currentUser={currentUser} 
          onClose={() => {
            setShowCommunityChat(false);
            setSelectedContent(null);
            refreshUser();
          }} 
        />
      )}

      {/* User Profile */}
      {showUserProfile && (
        <UserProfile user={currentUser} onClose={() => setShowUserProfile(false)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/95 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ffa500] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                The Connector
              </h1>
            </div>
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff6b35]/20 to-[#ffa500]/20 border border-[#ff6b35]/30">
                  <span className="text-sm font-semibold text-white">{currentUser.username}</span>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-[#ffa500]" />
                    <span className="text-sm font-bold text-[#ffa500]">{currentUser.points}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <section className="sticky top-[73px] z-30 backdrop-blur-xl bg-[#0a0a0f]/95 border-b border-white/5" data-testid="tab-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab("sports")}
              className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${
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
              className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${
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
              className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${
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

      {/* Hero Carousel */}
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
          currentUser={currentUser}
          onContentClick={handleContentClick}
          onRefreshUser={refreshUser}
        />

        <CategorySection
          title="Hot Drop Alert"
          emoji="🚨"
          description="5 new launches that broke the internet."
          content={getContentByCategory("hot_drop")}
          allContent={getAllContentByCategory("hot_drop")}
          categoryKey="hot_drop"
          currentUser={currentUser}
          onContentClick={handleContentClick}
          onRefreshUser={refreshUser}
        />

        <CategorySection
          title="Movies"
          emoji="🎬"
          description="Cinema that hits different."
          content={getContentByCategory("movies")}
          allContent={getAllContentByCategory("movies")}
          categoryKey="movies"
          currentUser={currentUser}
          onContentClick={handleContentClick}
          onRefreshUser={refreshUser}
        />

        <CategorySection
          title="Series"
          emoji="📺"
          description="Binge-worthy shows you can't pause."
          content={getContentByCategory("series")}
          allContent={getAllContentByCategory("series")}
          categoryKey="series"
          currentUser={currentUser}
          onContentClick={handleContentClick}
          onRefreshUser={refreshUser}
        />

        <CategorySection
          title="Sports"
          emoji="⚽"
          description="Game on. Right now."
          content={getContentByCategory("sports")}
          allContent={getAllContentByCategory("sports")}
          categoryKey="sports"
          currentUser={currentUser}
          onContentClick={handleContentClick}
          onRefreshUser={refreshUser}
        />

        <CategorySection
          title="Documentaries"
          emoji="🎥"
          description="Real stories, unreal impact."
          content={getContentByCategory("documentaries")}
          allContent={getAllContentByCategory("documentaries")}
          categoryKey="documentaries"
          currentUser={currentUser}
          onContentClick={handleContentClick}
          onRefreshUser={refreshUser}
        />

        <CategorySection
          title="Reality"
          emoji="🎭"
          description="Drama. Chaos. Peak entertainment."
          content={getContentByCategory("reality")}
          allContent={getAllContentByCategory("reality")}
          categoryKey="reality"
          currentUser={currentUser}
          onContentClick={handleContentClick}
          onRefreshUser={refreshUser}
        />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/95 border-t border-white/5" data-testid="bottom-navigation">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-around py-2 sm:py-3">
            {/* Home */}
            <button 
              className="flex flex-col items-center gap-1 px-2 sm:px-4 py-2 text-white hover:text-[#ff6b35] transition-colors" 
              data-testid="nav-home"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </button>

            {/* Leaderboard */}
            <button 
              className="flex flex-col items-center gap-1 px-2 sm:px-4 py-2 text-gray-400 hover:text-[#ff6b35] transition-colors" 
              data-testid="nav-leaderboard"
              onClick={() => setShowLeaderboard(true)}
            >
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs font-medium">Leaders</span>
            </button>

            {/* AI Agent - Center */}
            <button className="flex flex-col items-center gap-1 px-4 sm:px-6 py-2 -mt-8 bg-gradient-to-br from-[#ff6b35] to-[#ffa500] rounded-full shadow-lg shadow-[#ff6b35]/30" data-testid="nav-ai-agent">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-white">AI Agent</span>
            </button>

            {/* Community */}
            <button 
              className="flex flex-col items-center gap-1 px-2 sm:px-4 py-2 text-gray-400 hover:text-[#ff6b35] transition-colors" 
              data-testid="nav-community"
              onClick={() => {
                setSelectedContent(null);
                setShowCommunityChat(true);
              }}
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs font-medium">Community</span>
            </button>

            {/* Me */}
            <button 
              className="flex flex-col items-center gap-1 px-2 sm:px-4 py-2 text-gray-400 hover:text-[#ff6b35] transition-colors" 
              data-testid="nav-me"
              onClick={() => {
                if (currentUser) {
                  setShowUserProfile(true);
                } else {
                  setShowProfileSetup(true);
                }
              }}
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
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