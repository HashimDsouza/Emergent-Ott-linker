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
  ChevronDown,
} from "lucide-react";

// Brand colors - exact match to tiles
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

// Language options
const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
];

// Tooltip component - matching tile style
function Tip({ text }) {
  if (!text || typeof text !== "string") return null;
  return (
    <span 
      className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[9px] md:text-[10px] text-white shadow-lg border z-50"
      style={{
        backgroundColor: `${charcoal}F0`,
        borderColor: `${mint}30`,
        boxShadow: `0 0 12px ${mint}40`
      }}
    >
      {text}
    </span>
  );
}

// Premium Chip component with gradient borders
function Chip({ icon: Icon, label, tip, onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      className="relative flex items-center gap-1 md:gap-1.5 rounded-full px-2.5 md:px-3.5 py-1.5 md:py-2 text-[10px] md:text-[11px] font-medium text-white/90 transition-all whitespace-nowrap"
      style={{
        background: hover ? `linear-gradient(135deg, ${coral}15, ${mint}15)` : `${charcoal}80`,
        border: `1px solid ${hover ? mint : 'rgba(255,255,255,0.1)'}`,
        boxShadow: hover ? `0 0 16px ${coral}60, 0 0 8px ${mint}40` : 'none'
      }}
      aria-label={label}
    >
      {Icon && <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: hover ? mint : coral }} />}
      {label && <span>{label}</span>}
      {hover && tip && <Tip text={tip} />}
    </button>
  );
}

// Language Dropdown Component
function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(languages[0]);
  const [hover, setHover] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-1 md:gap-1.5 rounded-full px-2.5 md:px-3.5 py-1.5 md:py-2 text-[10px] md:text-[11px] font-medium text-white/90 transition-all whitespace-nowrap"
        style={{
          background: hover || open ? `linear-gradient(135deg, ${coral}15, ${mint}15)` : `${charcoal}80`,
          border: `1px solid ${hover || open ? mint : 'rgba(255,255,255,0.1)'}`,
          boxShadow: hover || open ? `0 0 16px ${coral}60, 0 0 8px ${mint}40` : 'none'
        }}
        aria-label="Language"
      >
        <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: hover || open ? mint : coral }} />
        <span>{selected.native}</span>
        <ChevronDown className="w-3 h-3" style={{ color: hover || open ? mint : 'white' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            className="absolute top-full mt-2 right-0 rounded-xl overflow-hidden shadow-xl border z-50 min-w-[140px]"
            style={{
              backgroundColor: `${charcoal}F5`,
              borderColor: `${mint}40`,
              boxShadow: `0 8px 24px ${charcoal}80, 0 0 16px ${mint}30`
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setSelected(lang);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-[11px] md:text-[12px] text-white/90 hover:text-white transition-colors"
                style={{
                  backgroundColor: selected.code === lang.code ? `${mint}20` : 'transparent',
                  borderLeft: selected.code === lang.code ? `2px solid ${mint}` : 'none'
                }}
              >
                <div className="font-medium">{lang.native}</div>
                <div className="text-[9px] opacity-70">{lang.name}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Header component with 2-row layout
export function ConnectorHeader() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{ 
        backgroundColor: `${charcoal}E6`,
        borderColor: `${mint}15`
      }}
    >
      {/* Top row: Logo, Search, Profile */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2.5 md:py-3">
        {/* Logo with premium glow */}
        <div 
          className="select-none font-bold text-xl md:text-2xl cursor-pointer"
          style={{ 
            color: coral,
            textShadow: `0 0 12px ${coral}60`
          }}
        >
          C•
        </div>

        {/* Search & Profile with hover effects */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            className="relative group p-1.5 rounded-full transition-all"
            style={{
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${mint}15`;
              e.currentTarget.style.boxShadow = `0 0 12px ${mint}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label="Search"
          >
            <Search 
              className="w-5 h-5 md:w-5.5 md:h-5.5 transition-colors" 
              style={{ color: coral }}
            />
          </button>
          <button 
            className="relative group p-1.5 rounded-full transition-all"
            style={{
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${mint}15`;
              e.currentTarget.style.boxShadow = `0 0 12px ${mint}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label="Profile"
          >
            <User 
              className="w-5 h-5 md:w-5.5 md:h-5.5 transition-colors"
              style={{ color: coral }}
            />
          </button>
        </div>
      </div>

      {/* Navigation chips - 2 rows */}
      <div className="px-3 md:px-6 pb-2.5 md:pb-3 space-y-2">
        {/* Row 1: Watch On, Buzz Meter, Win */}
        <div className="flex gap-2 md:gap-3 justify-center">
          <Chip icon={Play} label="Watch On" tip="Pick your platform. Jump right in." />
          <Chip icon={Flame} label="Buzz Meter" tip="If it's trending, it's here." />
          <Chip icon={Target} label="Win" tip="Flex your fandom. Score some cred." />
        </div>

        {/* Row 2: Game On, Entertainment, Lang */}
        <div className="flex gap-2 md:gap-3 justify-center">
          <Chip icon={Trophy} label="Game On" tip="The game never sleeps." />
          <Chip icon={Clapperboard} label="Entertainment" tip="Fresh stories. Zero scroll fatigue." />
          <LanguageDropdown />
        </div>
      </div>
    </header>
  );
}

// Footer component with emojis + icons
export function ConnectorFooter() {
  const NavItem = ({ emoji, icon: Icon, label, tip }) => {
    const [hover, setHover] = useState(false);
    
    return (
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative flex flex-col items-center gap-0.5 md:gap-1 text-white/80 hover:text-white transition-all py-1"
        style={{
          textShadow: hover ? `0 0 8px ${mint}80` : 'none'
        }}
        aria-label={label}
      >
        <div className="relative">
          {emoji && <span className="text-base md:text-lg">{emoji}</span>}
          {Icon && (
            <Icon 
              className="absolute inset-0 w-5 h-5 md:w-6 md:h-6 opacity-0 hover:opacity-100 transition-opacity" 
              style={{ 
                color: hover ? mint : coral,
                filter: hover ? `drop-shadow(0 0 4px ${mint})` : 'none'
              }}
            />
          )}
        </div>
        {label && (
          <span 
            className="text-[9px] md:text-[10px] font-medium"
            style={{ color: hover ? mint : 'inherit' }}
          >
            {label}
          </span>
        )}
        {hover && tip && <Tip text={tip} />}
      </button>
    );
  };

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t"
      style={{ 
        backgroundColor: `${charcoal}F0`,
        borderColor: `${coral}20`,
        boxShadow: `0 -4px 16px ${charcoal}80, 0 -1px 4px ${mint}20`
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-4 py-2 md:py-2.5">
        <NavItem emoji="🏠" icon={Home} label="Home" tip="Back to where the buzz begins." />
        <NavItem emoji="🧭" icon={Compass} label="Dive In" tip="Deep cuts. Hot picks. Dive already." />
        <NavItem emoji="👥" icon={Users} label="Crew" tip="Where fans become fam." />
        <NavItem emoji="⚡" icon={Zap} label="Get With It" tip="The headlines before they trend." />
      </div>
    </footer>
  );
}

// Connie AI floating button - sparkle centered above text
export function ConnieButton({ onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <button
      className="fixed bottom-16 md:bottom-20 right-4 md:right-6 w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center shadow-xl cursor-pointer select-none z-50 transition-all"
      style={{
        background: `linear-gradient(135deg, ${mint}, ${mint}E0)`,
        boxShadow: hover 
          ? `0 0 24px ${coral}, 0 0 12px ${mint}, 0 8px 16px ${charcoal}80` 
          : `0 4px 16px ${charcoal}80, 0 0 8px ${mint}60`,
        transform: hover ? 'scale(1.05)' : 'scale(1)'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      aria-label="Connie AI Assistant"
    >
      {/* Sparkle centered above text */}
      <span 
        className="text-[14px] md:text-[16px] mb-0.5"
        style={{ 
          color: coral,
          textShadow: `0 0 8px ${coral}80`,
          filter: hover ? `drop-shadow(0 0 4px ${coral})` : 'none'
        }}
      >
        ✦
      </span>
      {/* Connie text */}
      <span 
        className="text-[9px] md:text-[10px] font-bold tracking-wide"
        style={{ color: charcoal }}
      >
        Connie
      </span>
      {hover && <Tip text="Always watching out for what you'll love." />}
    </button>
  );
}
