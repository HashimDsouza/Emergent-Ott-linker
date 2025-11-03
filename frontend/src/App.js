import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import LandingV2_3Wrapper from "@/pages/LandingV2_3Wrapper";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingV2_3Wrapper />} />
          <Route path="/landing/v2_3" element={<LandingV2_3Wrapper />} />
          <Route path="/original" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;