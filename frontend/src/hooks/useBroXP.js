import { useState, useEffect } from 'react';
import { xpMilestones, getXPMessage } from '../components/BroConfig';

const XP_STORAGE_KEY = 'bro_xp';
const XP_HISTORY_KEY = 'bro_xp_history';

export const useBroXP = () => {
  const [xp, setXp] = useState(0);
  const [showMilestone, setShowMilestone] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  // Load XP from localStorage on mount
  useEffect(() => {
    const storedXP = localStorage.getItem(XP_STORAGE_KEY);
    if (storedXP) {
      setXp(parseInt(storedXP, 10));
    }
  }, []);

  // Save XP to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(XP_STORAGE_KEY, xp.toString());
  }, [xp]);

  // Add XP and handle milestones
  const addXP = (amount, action = 'generic') => {
    const newXP = xp + amount;
    const previousXP = xp;
    
    setXp(newXP);
    
    // Log action to history
    const history = JSON.parse(localStorage.getItem(XP_HISTORY_KEY) || '[]');
    history.push({
      action,
      xp: amount,
      total: newXP,
      timestamp: new Date().toISOString()
    });
    // Keep last 100 actions only
    if (history.length > 100) {
      history.shift();
    }
    localStorage.setItem(XP_HISTORY_KEY, JSON.stringify(history));

    // Get action message
    const message = getXPMessage(action);
    setLastAction({ action, xp: amount, message });

    // Check for milestone
    const milestoneKeys = Object.keys(xpMilestones).map(Number).sort((a, b) => b - a);
    const reachedMilestone = milestoneKeys.find(m => newXP >= m && previousXP < m);
    
    if (reachedMilestone) {
      setShowMilestone({
        xp: reachedMilestone,
        ...xpMilestones[reachedMilestone]
      });
      
      // Auto-hide milestone after 3 seconds
      setTimeout(() => {
        setShowMilestone(null);
      }, 3000);
    }

    // Auto-hide last action message after 2 seconds
    setTimeout(() => {
      setLastAction(null);
    }, 2000);
  };

  // Get XP level (for future gamification)
  const getLevel = () => {
    if (xp < 10) return 1;
    if (xp < 50) return 2;
    if (xp < 100) return 3;
    if (xp < 200) return 4;
    return 5;
  };

  // Get percentage to next milestone
  const getProgressToNextMilestone = () => {
    const milestoneKeys = Object.keys(xpMilestones).map(Number).sort((a, b) => a - b);
    const nextMilestone = milestoneKeys.find(m => m > xp);
    
    if (!nextMilestone) {
      return { percentage: 100, next: null, current: xp };
    }

    const previousMilestone = milestoneKeys.filter(m => m <= xp).pop() || 0;
    const range = nextMilestone - previousMilestone;
    const progress = xp - previousMilestone;
    const percentage = Math.floor((progress / range) * 100);

    return { percentage, next: nextMilestone, current: xp, previous: previousMilestone };
  };

  // Reset XP (for testing/admin purposes)
  const resetXP = () => {
    setXp(0);
    localStorage.removeItem(XP_STORAGE_KEY);
    localStorage.removeItem(XP_HISTORY_KEY);
    setShowMilestone(null);
    setLastAction(null);
  };

  return {
    xp,
    addXP,
    showMilestone,
    lastAction,
    getLevel,
    getProgressToNextMilestone,
    resetXP
  };
};

export default useBroXP;
