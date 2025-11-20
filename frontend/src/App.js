import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BroProvider } from "@/context/BroContext";
import axios from "axios";
import Home from "@/pages/Home";
import LandingV2_3Wrapper from "@/pages/LandingV2_3Wrapper";
import WatchOn from "@/pages/WatchOn";
import BuzzMeter from "@/pages/BuzzMeter";
import Entertainment from "@/pages/Entertainment";
import GameOn from "@/pages/GameOn";
import GetWithIt from "@/pages/GetWithIt";
import Win from "@/pages/Win";
import Crew from "@/pages/Crew";
import CrewDetail from "@/pages/CrewDetail";
import ContentDetail from "@/pages/ContentDetail";
import HappeningNow from "@/pages/HappeningNow";
import ShareModal from "@/components/ShareModal";
import FeedAdmin from "@/pages/FeedAdmin";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Wrapper for HappeningNow to provide data
function HappeningNowWrapper() {
  const [apiData, setApiData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await axios.get(`${API}/content`);
      setApiData({ items: response.data });
    } catch (error) {
      console.error("Error loading content:", error);
      setApiData({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E1514] text-white">
        <div>Loading...</div>
      </div>
    );
  }

  const handleShare = (content) => {
    setSelectedContent(content);
    setShareModalOpen(true);
  };

  return (
    <>
      <HappeningNow apiData={apiData} onShare={handleShare} />
      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        content={selectedContent || {}}
      />
    </>
  );
}

function App() {
  return (
    <BroProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingV2_3Wrapper />} />
            <Route path="/landing/v2_3" element={<LandingV2_3Wrapper />} />
            <Route path="/watch-on" element={<WatchOn />} />
            <Route path="/buzz-meter" element={<BuzzMeter />} />
            <Route path="/entertainment" element={<Entertainment />} />
            <Route path="/game-on" element={<GameOn />} />
            <Route path="/get-with-it" element={<GetWithIt />} />
            <Route path="/happening-now" element={<HappeningNowWrapper />} />
            <Route path="/win" element={<Win />} />
            <Route path="/crew" element={<Crew />} />
            <Route path="/crew/:crewId" element={<CrewDetail />} />
            <Route path="/content/:contentId" element={<ContentDetail />} />
            <Route path="/feed-admin" element={<FeedAdmin />} />
            <Route path="/original" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </div>
    </BroProvider>
  );
}

export default App;