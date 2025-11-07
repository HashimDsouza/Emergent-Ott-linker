import React from 'react';

const coral = "#FF4F64";

/**
 * Standardized Tray Header Component
 * Ensures consistent visual identity across ALL pages
 * Format: [Emoji] Title in White + Subline in Coral Italic
 */
export default function TrayHeader({ emoji, title, subline, children }) {
  return (
    <div className="mb-3 md:mb-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
            {emoji && <span>{emoji}</span>}
            {title}
          </div>
          {subline && (
            <div 
              className="text-[10px] md:text-sm italic mt-0.5"
              style={{ color: coral }}
            >
              {subline}
            </div>
          )}
        </div>
        {children && <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">{children}</div>}
      </div>
    </div>
  );
}
