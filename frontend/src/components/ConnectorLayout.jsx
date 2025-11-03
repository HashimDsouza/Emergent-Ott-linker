import React, { useState } from "react";
import {
  Search,
  User,
  Flame,
  Play,
  Trophy,
  Clapperboard,
  Globe,
  Target,
  Compass,
  Users,
  Home,
  Zap,
} from "lucide-react";

// Brand colors - matching existing palette
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

// Tooltip component
function Tip({ text }) {
  if (!text || typeof text !== "string") return null;
  return (
    <span className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/90 px-2 py-1 text-[9px] md:text-[10px] text-white shadow-lg border border-white/10 z-50">
      {text}
    </span>
  );
}

// Chip component for header buttons
function Chip({ icon: Icon, label, tip, onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      className="relative flex items-center gap-1 md:gap-2 rounded-full border border-white/10 bg-white/5 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-[12px] text-white/90 hover:bg-white/10 hover:border-white/20 transition-all whitespace-nowrap"
      style={{
        boxShadow: hover ? `0 0 12px ${mint}40` : 'none'
      }}
      aria-label={label}
    >
      {Icon && <Icon className="w-3 h-3 md:w-4 md:h-4" style={{ color: hover ? mint : 'inherit' }} />}
      {label && <span>{label}</span>}
      {hover && tip && <Tip text={tip} />}
    </button>
  );
}

// Header component
export function ConnectorHeader() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b border-white/5"
      style={{ backgroundColor: `${charcoal}CC` }}
    >
      {/* Top row: Logo, Search, Profile */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
        {/* Logo */}
        <div 
          className="select-none font-bold text-lg md:text-2xl cursor-pointer"
          style={{ color: coral }}
        >
          C•
        </div>

        {/* Search & Profile */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            className="relative group"
            aria-label="Search"
          >
            <Search 
              className="w-5 h-5 md:w-6 md:h-6 cursor-pointer transition-colors" 
              style={{ color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.color = mint}
              onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
            />
          </button>
          <button 
            className="relative group"
            aria-label="Profile"
          >
            <User 
              className="w-5 h-5 md:w-6 md:h-6 cursor-pointer transition-colors"
              style={{ color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.color = mint}
              onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
            />
          </button>
        </div>
      </div>

      {/* Bottom row: Navigation chips - horizontal scroll on mobile */}
      <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 md:pb-3">
        <div className="flex gap-2 md:gap-3 min-w-max">
          <Chip icon={Play} label="Watch On" tip="Pick your platform. Jump right in." />
          <Chip icon={Flame} label="Buzz Meter" tip="If it's trending, it's here." />
          <Chip icon={Target} label="Win" tip="Flex your fandom. Score some cred." />
          <Chip icon={Trophy} label="Game On" tip="The game never sleeps." />
          <Chip icon={Clapperboard} label="Entertainment" tip="Fresh stories. Zero scroll fatigue." />
          <Chip icon={Globe} label="Lang" tip="Switch the lingo, keep the drama." />
        </div>
      </div>
    </header>
  );
}

// Footer component (Bottom Navigation)
export function ConnectorFooter() {
  const NavItem = ({ icon: Icon, label, tip }) => {
    const [hover, setHover] = useState(false);
    
    return (
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
        aria-label={label}
      >
        {Icon && (
          <Icon 
            className="w-5 h-5 md:w-6 md:h-6" 
            style={{ color: hover ? mint : 'inherit' }}
          />
        )}
        {label && <span className="text-[9px] md:text-[10px]">{label}</span>}
        {hover && tip && <Tip text={tip} />}
      </button>
    );
  };

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t border-white/5 py-2 md:py-3"
      style={{ backgroundColor: `${charcoal}E6` }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-4">
        <NavItem icon={Home} label="Home" tip="Back to where the buzz begins." />
        <NavItem icon={Compass} label="Dive In" tip="Deep cuts. Hot picks. Dive already." />
        <NavItem icon={Users} label="Crew" tip="Where fans become fam." />
        <NavItem icon={Zap} label="Get With It" tip="The headlines before they trend." />
      </div>
    </footer>
  );
}

// Connie AI floating button
export function ConnieButton({ onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <button
      className="fixed bottom-20 md:bottom-24 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer select-none z-50 transition-all"
      style={{
        backgroundColor: mint,
        boxShadow: hover ? `0 0 20px ${coral}` : `0 4px 12px ${charcoal}80`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      aria-label="Connie AI Assistant"
    >
      <div className="relative flex items-center justify-center">
        <span 
          className="absolute -top-1 -right-1 text-[10px] md:text-[12px]"
          style={{ color: coral }}
        >
          ✦
        </span>
        <span 
          className="text-[10px] md:text-[11px] font-semibold"
          style={{ color: charcoal }}
        >
          Connie
        </span>
      </div>
      {hover && <Tip text="Always watching out for what you'll love." />}
    </button>
  );
}

// Hide scrollbar utility
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Add scrollbar hide styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = scrollbarHideStyle;
  document.head.appendChild(styleSheet);
}
