import React, { useState, useEffect } from 'react';
import { getRandomBuzzMoment } from './BroConfig';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoalSoft = "#173A35";

export default function BuzzMoment() {
  const [moment, setMoment] = useState('');

  useEffect(() => {
    // Get a random buzz moment on mount
    setMoment(getRandomBuzzMoment());
  }, []);

  if (!moment) return null;

  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium animate-fadeIn"
      style={{ 
        background: `linear-gradient(135deg, ${coral}15, ${mint}15)`,
        border: `1px solid ${mint}30`,
        color: coral
      }}
    >
      <span style={{ color: mint }}>🔥</span>
      <span className="italic">{moment}</span>
    </div>
  );
}
