import React from 'react';
import { getFlagUrl } from '../config/sportsConfig';

/**
 * FlagIcon component - Renders flag images properly on both web and mobile
 * Falls back to emoji if no flagCode is provided
 */
export default function FlagIcon({ flagCode, emoji, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-5 h-4',
    lg: 'w-6 h-5',
    xl: 'w-8 h-6'
  };

  // If we have a flagCode, use the image API
  if (flagCode) {
    return (
      <img 
        src={getFlagUrl(flagCode)} 
        alt={`${flagCode} flag`}
        className={`${sizeClasses[size]} object-cover rounded-sm ${className}`}
        onError={(e) => {
          // Fallback to emoji if image fails to load
          e.target.style.display = 'none';
          const span = document.createElement('span');
          span.textContent = emoji || '🏴';
          span.className = 'text-base';
          e.target.parentNode.insertBefore(span, e.target);
        }}
      />
    );
  }

  // Fallback to emoji for teams/leagues without country flags
  return (
    <span className={`text-lg ${className}`}>
      {emoji}
    </span>
  );
}
