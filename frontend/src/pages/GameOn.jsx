import React, { useState } from "react";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import GameOnHeader from "../components/GameOnHeader";
import SpotlightSection from "../components/SpotlightSection";

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

        {/* Spotlight Hero Section */}
        <SpotlightSection 
          selectedSport={selectedSport}
          selectedLeague={selectedLeague}
        />

        {/* Content Trays - Coming Next */}
        <div className="px-3 md:px-6 pb-12 text-center">
          <p className="text-white/60 text-sm italic">
            Content trays loading soon... 🚀
          </p>
        </div>

      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
    </>
  );
}
