import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BroOverlay from "./BroOverlay";
import { useBro } from "../context/BroContext";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

// Bro button component with XP badge
function BroButton({ onClick, xp, xpPulse }) {
  const [hover, setHover] = useState(false);
  
  return (
    <button
      onClick={onClick}
      className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center shadow-xl cursor-pointer select-none transition-all"
      style={{
        background: `linear-gradient(135deg, ${mint}, ${mint}E0)`,
        boxShadow: hover 
          ? `0 0 24px ${coral}, 0 0 12px ${mint}, 0 8px 16px ${charcoal}80` 
          : `0 4px 16px ${charcoal}80, 0 0 8px ${mint}60`,
        transform: hover ? 'scale(1.05)' : 'scale(1)'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Bro AI Assistant"
    >
      {/* XP Badge */}
      {xp > 0 && (
        <div 
          className="absolute -top-1 -right-1 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold"
          style={{
            backgroundColor: coral,
            color: 'white',
            boxShadow: `0 0 12px ${coral}80, 0 2px 4px ${charcoal}60`,
            animation: xpPulse ? 'xpPulse 0.6s ease-out' : 'none'
          }}
        >
          {xp}
        </div>
      )}
      
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
        {/* Bro text */}
        <span 
          className="text-[9px] md:text-[10px] font-bold tracking-wide leading-none mt-0.5"
          style={{ color: charcoal }}
        >
          Bro
        </span>
      </div>
    </button>
  );
}

const ConnieFloating = ({
  footerSelector,
  offsetPx = 24,
  fallbackFooterHeightPx = 72,
  scrollAware = true,
  startHidden = false,
  zIndex = 9999,
}) => {
  const [mounted, setMounted] = useState(false);
  const [footerHeight, setFooterHeight] = useState(fallbackFooterHeightPx);
  const [visible, setVisible] = useState(!startHidden);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [xpPulse, setXpPulse] = useState(false);
  const lastScrollYRef = useRef(0);
  const rafRef = useRef(null);
  const resizeObsRef = useRef(null);
  
  // XP from Context
  const { xp, showMilestone, lastAction } = useBro();

  useEffect(() => {
    const getFooterEl = () => {
      if (footerSelector) return document.querySelector(footerSelector);
      return document.querySelector("[data-footer]") || document.querySelector("footer");
    };

    const footerEl = getFooterEl();
    if (!footerEl) {
      setFooterHeight(fallbackFooterHeightPx);
      setMounted(true);
      return;
    }

    const updateSize = () => {
      const rect = footerEl.getBoundingClientRect();
      const h = rect.height || footerEl.offsetHeight || fallbackFooterHeightPx;
      setFooterHeight(h);
    };

    updateSize();

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => updateSize());
      ro.observe(footerEl);
      resizeObsRef.current = ro;
    }

    setMounted(true);
    return () => resizeObsRef.current?.disconnect?.();
  }, [footerSelector, fallbackFooterHeightPx]);

  useEffect(() => {
    if (!scrollAware) return;

    const onScroll = () => {
      const y = window.scrollY || 0;
      const lastY = lastScrollYRef.current;
      const delta = y - lastY;
      const threshold = 6;

      if (delta > threshold) setVisible(false);
      else if (delta < -threshold) setVisible(true);

      lastScrollYRef.current = y;
    };

    const onScrollRaf = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(onScroll);
    };

    window.addEventListener("scroll", onScrollRaf, { passive: true });
    return () => window.removeEventListener("scroll", onScrollRaf);
  }, [scrollAware]);

  // Pulse XP badge when XP changes
  useEffect(() => {
    if (lastAction) {
      setXpPulse(true);
      setTimeout(() => setXpPulse(false), 600);
    }
  }, [lastAction]);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const style = {
    position: "fixed",
    right: 20,
    zIndex,
    pointerEvents: "auto",
    transition: "transform 160ms ease, opacity 160ms ease",
    transform: visible ? "translateY(0)" : "translateY(120%)",
    opacity: visible ? 1 : 0.95,
  };

  const css = `
    #bro-orb {
      bottom: calc(env(safe-area-inset-bottom) + var(--footer-height, ${fallbackFooterHeightPx}px) + ${offsetPx}px);
    }
    @media (max-width: 480px) { #bro-orb { right: 16px; } }
    
    @keyframes xpPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); box-shadow: 0 0 20px ${coral}; }
      100% { transform: scale(1); }
    }
  `;

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        id="bro-orb"
        style={{ ...style, ["--footer-height"]: `${footerHeight}px` }}
        className="flex items-center justify-center"
      >
        <BroButton onClick={() => setOverlayOpen(true)} xp={xp} xpPulse={xpPulse} />
      </div>

      {/* Bro Overlay */}
      <BroOverlay 
        isOpen={overlayOpen} 
        onClose={() => setOverlayOpen(false)}
        xp={xp}
      />

      {/* XP Action Toast */}
      {lastAction && (
        <div 
          className="fixed bottom-32 right-20 md:right-24 z-[10000] px-4 py-2 rounded-lg shadow-xl animate-slideUp"
          style={{
            backgroundColor: `${charcoal}F0`,
            border: `1px solid ${mint}60`,
            color: mint
          }}
        >
          <p className="text-sm font-medium">+{lastAction.xp} XP</p>
          <p className="text-xs italic" style={{ color: coral }}>{lastAction.message}</p>
        </div>
      )}

      {/* Milestone Toast */}
      {showMilestone && (
        <div 
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000] px-6 py-4 rounded-xl shadow-2xl animate-bounceIn text-center"
          style={{
            background: `linear-gradient(135deg, ${coral}20, ${mint}20)`,
            border: `2px solid ${mint}`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="text-4xl mb-2">{showMilestone.emoji}</div>
          <p className="text-xl font-bold text-white mb-1">{showMilestone.xp} XP!</p>
          <p className="text-sm italic" style={{ color: coral }}>{showMilestone.message}</p>
        </div>
      )}

      {/* Additional Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50px) scale(0.8);
          }
          50% {
            transform: translate(-50%, 10px) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-bounceIn {
          animation: bounceIn 0.5s ease-out;
        }
      `}</style>
    </>,
    document.body
  );
};

export default ConnieFloating;
