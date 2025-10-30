import React, { useState, useMemo } from "react";
import "../styles/gradients.css";
import { mapApiToCard } from "../utils/mapApiToCard";
import HeroFrontCenter from "../components/HeroFrontCenter";
import Tray from "../components/Tray";
import DetailsModal from "../components/DetailsModal";

export default function LandingV2_3({ apiData }) {
  const cards = useMemo(() => (apiData?.items || []).map(mapApiToCard), [apiData]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const onInfo = (item) => { setModalItem(item); setModalOpen(true); };

  return (
    <div className="min-h-screen p-6 landing-v23-bg text-white">
      <div className="max-w-6xl mx-auto">
        <HeroFrontCenter />

        <Tray
          icon="🔥"
          title="Buzzing Now"
          subline="The internet’s current obsession"
          items={cards.slice(0,6)}
          onInfo={onInfo}
        />
        <Tray
          icon="👀"
          title="Your Must Watch Today"
          subline="Editor’s picks you can’t skip"
          items={cards.slice(6,12)}
          onInfo={onInfo}
        />
        <Tray
          icon="🏆"
          title="Game On"
          subline="Matches, highlights, and scores"
          items={cards.slice(12,18)}
          onInfo={onInfo}
        />

        <DetailsModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} />
      </div>
    </div>
  );
}