import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BroProvider } from "@/context/BroContext";
import Home from "@/pages/Home";
import LandingV2_3Wrapper from "@/pages/LandingV2_3Wrapper";
import WatchOn from "@/pages/WatchOn";
import BuzzMeter from "@/pages/BuzzMeter";
import Entertainment from "@/pages/Entertainment";
import GameOn from "@/pages/GameOn";
import GetWithIt from "@/pages/GetWithIt";
import Win from "@/pages/Win";
import Crew from "@/pages/Crew";
import FeedAdmin from "@/pages/FeedAdmin";

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
            <Route path="/win" element={<Win />} />
            <Route path="/feed-admin" element={<FeedAdmin />} />
            <Route path="/original" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </div>
    </BroProvider>
  );
}

export default App;