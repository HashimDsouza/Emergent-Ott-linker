import React, { useState, useEffect } from "react";
import axios from "axios";
import LandingV2_3 from "./LandingV2_3";
import ConnieFloating from "../components/ConnieFloating";
import ShareModal from "../components/ShareModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingV2_3Wrapper() {
  const [apiData, setApiData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

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

  return (
    <>
      <LandingV2_3 apiData={apiData} />
      <ConnieFloating offsetPx={140} />
    </>
  );
}
