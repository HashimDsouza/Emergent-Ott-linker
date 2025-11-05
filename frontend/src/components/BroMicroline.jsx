import React, { useState, useEffect } from 'react';
import { getRandomMicroline } from './BroConfig';

const coral = "#FF4F64";

export default function BroMicroline() {
  const [microline, setMicroline] = useState('');

  useEffect(() => {
    // Get a random microline on mount
    setMicroline(getRandomMicroline());
  }, []);

  if (!microline) return null;

  return (
    <div className="text-center mt-2 animate-fadeIn">
      <p className="text-xs md:text-sm italic" style={{ color: coral }}>
        {microline}
      </p>
    </div>
  );
}
