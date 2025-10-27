import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Star, Award, TrendingUp } from "lucide-react";

const UserProfile = ({ user, onClose }) => {
  if (!user) return null;

  const getBadgeColor = (badge) => {
    if (badge.includes("Lover")) return "bg-red-500/20 text-red-500 border-red-500/30";
    if (badge.includes("Social")) return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    if (badge.includes("Master")) return "bg-purple-500/20 text-purple-500 border-purple-500/30";
    return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span className="gradient-text">My Profile</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Profile Header */}
          <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-[#ff6b35]"
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {user.username}
              </h2>
              <p className="text-gray-400 text-sm mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff6b35]/20 to-[#ffa500]/20 border border-[#ff6b35]/30">
                  <Trophy className="w-5 h-5 text-[#ffa500]" />
                  <span className="font-bold text-white">{user.points} Points</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <Star className="w-5 h-5 text-white" />
                  <span className="font-bold text-white">Level {user.level}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">❤️</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{user.liked_content?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Content Liked</p>
            </div>

            <div className="glass-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-[#ff6b35]/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#ff6b35]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{user.badges?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Badges Earned</p>
            </div>

            <div className="glass-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{user.points}</p>
              <p className="text-xs text-gray-400 mt-1">Total Points</p>
            </div>
          </div>

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <Award className="w-6 h-6 text-[#ffa500]" />
                Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, index) => (
                  <div
                    key={index}
                    className={`px-4 py-2 rounded-full border font-semibold text-sm ${getBadgeColor(badge)}`}
                  >
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Platforms/Genres */}
          <div className="grid sm:grid-cols-2 gap-4">
            {user.favorite_platforms && user.favorite_platforms.length > 0 && (
              <div className="glass-card p-4">
                <h4 className="font-semibold text-white mb-3">Favorite Platforms</h4>
                <div className="flex flex-wrap gap-2">
                  {user.favorite_platforms.map((platform, index) => (
                    <span key={index} className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.favorite_genres && user.favorite_genres.length > 0 && (
              <div className="glass-card p-4">
                <h4 className="font-semibold text-white mb-3">Favorite Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {user.favorite_genres.map((genre, index) => (
                    <span key={index} className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress to Next Level */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">Progress to Level {user.level + 1}</h4>
              <span className="text-sm text-gray-400">
                {user.points % 100}/100 points
              </span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff6b35] to-[#ffa500] transition-all duration-500"
                style={{ width: `${(user.points % 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {100 - (user.points % 100)} points until next level!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;