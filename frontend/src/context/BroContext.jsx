import React, { createContext, useContext } from 'react';
import { useBroXP } from '../hooks/useBroXP';

const BroContext = createContext(null);

export const BroProvider = ({ children }) => {
  const broXP = useBroXP();
  
  return (
    <BroContext.Provider value={broXP}>
      {children}
    </BroContext.Provider>
  );
};

export const useBro = () => {
  const context = useContext(BroContext);
  if (!context) {
    throw new Error('useBro must be used within a BroProvider');
  }
  return context;
};

export default BroContext;
