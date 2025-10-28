import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaderboardModal = ({ onClose, currentUser }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard?limit=10`);
      setLeaders(response.data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-[#ffd700]" />;
    if (index === 1) return <Medal className="w-6 h-6 text-[#c0c0c0]" />;
    if (index === 2) return <Award className="w-6 h-6 text-[#cd7f32]" />;
    return <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Trophy className="w-8 h-8 text-[#ffa500]" />
            <span className="gradient-text">Leaderboard</span>
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">Top contributors on The Connector</p>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users on the leaderboard yet. Be the first!</p>
            </div>
          ) : (
            leaders.map((leader, index) => (
              <div
                key={leader.id}
                className={`glass-card p-4 flex items-center gap-4 transition-all duration-300 ${
                  currentUser && leader.id === currentUser.id
                    ? 'border-2 border-[#ff6b35] shadow-lg shadow-[#ff6b35]/20'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <img
                  src={leader.avatar}
                  alt={leader.username}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                />

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {leader.username}
                    </h3>
                    {currentUser && leader.id === currentUser.id && (
                      <span className="text-xs px-2 py-1 rounded-full bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-400">Level {leader.level}</span>
                    {leader.badges && leader.badges.length > 0 && (
                      <div className="flex gap-1">
                        {leader.badges.slice(0, 3).map((badge, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff6b35]/20 to-[#ffa500]/20 border border-[#ff6b35]/30">
                  <Trophy className="w-5 h-5 text-[#ffa500]" />
                  <span className="font-bold text-white text-lg">{leader.points}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {currentUser && !leaders.find(l => l.id === currentUser.id) && (
          <div className="mt-6 p-4 glass-card border-2 border-[#ff6b35]/30">
            <p className="text-sm text-gray-400 mb-2">Your Stats:</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{currentUser.username}</span>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#ffa500]" />
                <span className="font-bold text-white">{currentUser.points} pts</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Keep engaging to climb the ranks!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardModal;