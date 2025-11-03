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

// Tooltip component - works on hover (desktop) and long-press (mobile)
function Tip({ text }) {
  if (!text || typeof text !== "string") return null;
  return (
    <span 
      className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[9px] md:text-[10px] text-white shadow-lg border z-50 opacity-0 group-hover:opacity-100 transition-opacity"
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

// Enhanced chip component with mobile tooltip support via long-press
function Chip({ icon: Icon, label, tip, onClick }) {
  const [hover, setHover] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const longPressTimer = React.useRef(null);
  
  const handleTouchStart = () => {
    if (tip) {
      longPressTimer.current = setTimeout(() => {
        setShowTip(true);
        setTimeout(() => setShowTip(false), 2000); // Hide after 2s
      }, 500); // Show tooltip after 500ms long press
    }
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };
  
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      className="relative group flex items-center gap-1 md:gap-1.5 rounded-full px-2.5 md:px-3.5 py-1.5 md:py-2 text-[10px] md:text-[11px] font-medium text-white/90 transition-all whitespace-nowrap"
      style={{
        background: hover 
          ? `linear-gradient(135deg, ${coral}30, ${mint}30)` 
          : `${charcoal}80`,
        border: `1px solid ${hover ? mint : 'rgba(255,255,255,0.1)'}`,
        boxShadow: hover ? `0 0 16px ${coral}60, 0 0 8px ${mint}40` : 'none'
      }}
      aria-label={label}
    >
      {Icon && <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: hover ? mint : coral }} />}
      {label && <span>{label}</span>}
      {(hover || showTip) && tip && <Tip text={tip} />}
    </button>
  );
}

// Language Dropdown Component with mobile tooltip support
function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(languages[0]);
  const [hover, setHover] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const longPressTimer = React.useRef(null);
  
  const handleTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 2000);
    }, 500);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <div className="relative group">
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
        {(hover || showTip) && !open && <Tip text="Switch the lingo, keep the drama." />}
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

// Header component with optimized 2-row layout and gradient background
export function ConnectorHeader() {
  const [searchHover, setSearchHover] = useState(false);
  const [meHover, setMeHover] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b relative overflow-hidden"
      style={{ 
        backgroundColor: charcoal,
        borderColor: `${mint}20`
      }}
    >
      {/* Gradient overlay for premium feel */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${coral}15, ${mint}15, ${charcoal}00)`,
          opacity: 0.15
        }}
      />

      {/* Row 1: Logo | USP Chips (Watch On, Buzz Meter, Win) | Search & Me */}
      <div className="relative flex items-center justify-between px-3 md:px-6 py-2 md:py-2.5">
        {/* Logo with premium glow and tooltip */}
        <button 
          className="relative group"
          onMouseEnter={(e) => e.currentTarget.querySelector('.logo-tip')?.classList.add('visible')}
          onMouseLeave={(e) => e.currentTarget.querySelector('.logo-tip')?.classList.remove('visible')}
          aria-label="Logo"
        >
          <div 
            className="select-none font-bold text-xl md:text-2xl cursor-pointer"
            style={{ 
              color: coral,
              textShadow: `0 0 12px ${coral}60`
            }}
          >
            C•
          </div>
          <span className="logo-tip hidden group-hover:block">
            <Tip text="All the action. None of the confusion." />
          </span>
        </button>

        {/* Center: USP Chips (Watch On, Buzz Meter, Win) */}
        <div className="flex gap-2 md:gap-3">
          <Chip icon={Play} label="Watch On" tip="Pick your platform. Jump right in." />
          <Chip icon={Flame} label="Buzz Meter" tip="If it's trending, it's here." />
          <Chip icon={Target} label="Win" tip="Flex your fandom. Score some cred." />
        </div>

        {/* Right: Search & Me with hover effects and tooltips */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            className="relative group p-1.5 rounded-full transition-all"
            style={{
              background: searchHover ? `${mint}15` : 'transparent',
              boxShadow: searchHover ? `0 0 12px ${mint}40` : 'none'
            }}
            onMouseEnter={() => setSearchHover(true)}
            onMouseLeave={() => setSearchHover(false)}
            aria-label="Search"
          >
            <Search 
              className="w-5 h-5 md:w-5.5 md:h-5.5 transition-colors" 
              style={{ color: coral }}
            />
            {searchHover && <Tip text="Find it before your friends do." />}
          </button>
          <button 
            className="relative group p-1.5 rounded-full transition-all"
            style={{
              background: meHover ? `${mint}15` : 'transparent',
              boxShadow: meHover ? `0 0 12px ${mint}40` : 'none'
            }}
            onMouseEnter={() => setMeHover(true)}
            onMouseLeave={() => setMeHover(false)}
            aria-label="Me"
          >
            <User 
              className="w-5 h-5 md:w-5.5 md:h-5.5 transition-colors"
              style={{ color: coral }}
            />
            {meHover && <Tip text="Your taste. Your vibe. Your call." />}
          </button>
        </div>
      </div>

      {/* Row 2: Game On, Entertainment, Lang (centered) */}
      <div className="relative px-3 md:px-6 pb-2 md:pb-2.5">
        <div className="flex gap-2 md:gap-3 justify-center">
          <Chip icon={Trophy} label="Game On" tip="The game never sleeps." />
          <Chip icon={Clapperboard} label="Entertainment" tip="Fresh stories. Zero scroll fatigue." />
          <LanguageDropdown />
        </div>
      </div>
    </header>
  );
}

// Footer component with emojis + icons and gradient background
export function ConnectorFooter() {
  const NavItem = ({ emoji, icon: Icon, label, tip }) => {
    const [hover, setHover] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const longPressTimer = React.useRef(null);
    
    const handleTouchStart = () => {
      if (tip) {
        longPressTimer.current = setTimeout(() => {
          setShowTip(true);
          setTimeout(() => setShowTip(false), 2000);
        }, 500);
      }
    };
    
    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
    
    return (
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative group flex flex-col items-center gap-0.5 md:gap-1 text-white/80 hover:text-white transition-all py-1"
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
        {(hover || showTip) && tip && <Tip text={tip} />}
      </button>
    );
  };

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t relative overflow-hidden"
      style={{ 
        backgroundColor: charcoal,
        borderColor: `${coral}20`,
        boxShadow: `0 -4px 16px ${charcoal}80, 0 -1px 4px ${mint}20`
      }}
    >
      {/* Gradient overlay matching header */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${coral}15, ${mint}15, ${charcoal}00)`,
          opacity: 0.15
        }}
      />
      
      <div className="relative flex items-center justify-around max-w-md mx-auto px-4 py-2 md:py-2.5">
        <NavItem emoji="🏠" icon={Home} label="Home" tip="Back to where the buzz begins." />
        <NavItem emoji="🧭" icon={Compass} label="Dive In" tip="Deep cuts. Hot picks. Dive already." />
        <NavItem emoji="👥" icon={Users} label="Crew" tip="Where fans become fam." />
        <NavItem emoji="⚡" icon={Zap} label="Get With It" tip="The headlines before they trend." />
      </div>
    </footer>
  );
}

// Connie AI floating button - positioned well above footer with increased safe spacing
export function ConnieButton({ onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <button
      className="fixed right-4 md:right-6 w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center shadow-xl cursor-pointer select-none z-50 transition-all"
      style={{
        bottom: 'calc(72px + 8px)', // Footer height + extra margin to prevent overlap
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
      {/* Sparkle perfectly centered above text */}
      <div className="flex flex-col items-center justify-center gap-0">
        <span 
          className="text-[14px] md:text-[16px] leading-none"
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
          className="text-[9px] md:text-[10px] font-bold tracking-wide leading-none mt-0.5"
          style={{ color: charcoal }}
        >
          Connie
        </span>
      </div>
      {hover && <Tip text="Always watching out for what you'll love." />}
    </button>
  );
}
