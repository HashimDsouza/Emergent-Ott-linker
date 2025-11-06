import React, { useState } from "react";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import GameOnHeader from "../components/GameOnHeader";
import SpotlightSection from "../components/SpotlightSection";
import LiveMatchesTray from "../components/LiveMatchesTray";
import TodaysMatchesTray from "../components/TodaysMatchesTray";
import BigMomentsTray from "../components/BigMomentsTray";
import ComingUpTray from "../components/ComingUpTray";
import HighlightsTray from "../components/HighlightsTray";
import BestOfTray from "../components/BestOfTray";

const charcoal = "#0E1514";

export default function GameOn() {
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);

  const handleSportChange = (sportId) => {
    setSelectedSport(sportId);
    console.log('Sport selected:', sportId);
  };

  const handleLeagueChange = (leagueId) => {
    setSelectedLeague(leagueId);
    console.log('League selected:', leagueId);
  };

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: charcoal }}>
        <ConnectorHeader />
        
        {/* Two-Tier Header */}
        <GameOnHeader 
          onSportChange={handleSportChange}
          onLeagueChange={handleLeagueChange}
        />

        {/* Spotlight Hero Section - Tournaments/Events Only */}
        <SpotlightSection 
          selectedSport={selectedSport}
          selectedLeague={selectedLeague}
        />

        {/* Content Trays */}
        <div style={{ backgroundColor: charcoal }}>
          {/* TRAY 1: LIVE RIGHT NOW - Prominent First Position */}
          <LiveMatchesTray />

          {/* TRAY 2: TODAY'S MATCHES - Coming Next */}
          
          {/* TRAY 3: BIG MOMENTS - Viral Clips */}
          <BigMomentsTray />

          {/* Other trays - Coming Next */}
          <div className="px-3 md:px-6 pb-12 text-center">
            <p className="text-white/60 text-sm italic">
              More trays loading soon... 🚀
            </p>
          </div>
        </div>

      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
    </>
  );
}
