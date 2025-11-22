import React, { useState, useEffect } from "react";
import axios from "axios";
import LandingV2_3 from "./LandingV2_3";
import ConnieFloating from "../components/ConnieFloating";
import SocialShareModal from "../components/SocialShareModal";
import ShareToCrewModal from "../components/ShareToCrewModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingV2_3Wrapper() {
  const [apiData, setApiData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareToCrewModalOpen, setShareToCrewModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Setup global function for crew share modal trigger
  useEffect(() => {
    window.openCrewShareModal = (content) => {
      setSelectedContent(content);
      setShareToCrewModalOpen(true);
    };
    return () => {
      delete window.openCrewShareModal;
    };
  }, []);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // Seed content if needed (commented out - content already exists)
      // await axios.post(`${API}/content/seed`);
      
      // Fetch content
      const response = await axios.get(`${API}/content`);
      
      // Transform to expected format for LandingV2_3
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
        <div>Loading preview...</div>
      </div>
    );
  }

  const handleShare = (content) => {
    setSelectedContent(content);
    setShareModalOpen(true);
  };

  const handleAddToWatchlist = async (content) => {
    try {
      await axios.post(`${API}/watchlist/add`, {
        user_id: "anonymous",
        content_id: content.id || content.title,
        content_type: "movie",
        content_title: content.title,
        content_image: content.thumbnail || content.poster_url || content.posterUrl,
      });
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
  };

  const handleShareToCrew = (content) => {
    setSelectedContent(content);
    setShareToCrewModalOpen(true);
  };

  return (
    <>
      <LandingV2_3 apiData={apiData} onShare={handleShareToCrew} onAddToWatchlist={handleAddToWatchlist} />
      <ConnieFloating offsetPx={140} />
      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        content={selectedContent || {}}
      />
      <ShareToCrewModal
        isOpen={shareToCrewModalOpen}
        onClose={() => setShareToCrewModalOpen(false)}
        content={selectedContent || {}}
      />
    </>
  );
}
