import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserProfileModal = ({ onUserCreated, onClose }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/users`, {
        username: username.trim(),
        email: email.trim()
      });
      
      toast.success(`Welcome to The Connector, ${response.data.username}! 🎉`);
      onUserCreated(response.data);
    } catch (error) {
      toast.error("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ffa500] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="gradient-text">Join The Connector</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <p className="text-gray-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create your profile to start earning points by liking, sharing, and discussing content!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Username</label>
              <Input
                type="text"
                placeholder="Choose a cool username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            <div className="glass-card p-4 space-y-2">
              <p className="text-xs font-semibold text-[#ff6b35]">Start Earning Points:</p>
              <ul className="text-xs text-gray-400 space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                <li>❤️ Like content: +5 points</li>
                <li>📤 Share content: +10 points</li>
                <li>💬 Join discussions: +15 points</li>
                <li>🏆 Climb the leaderboard!</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ff6b35] to-[#ffa500] hover:from-[#ff8555] hover:to-[#ffb833] text-white font-semibold py-6 rounded-full"
            >
              {loading ? "Creating..." : "Let's Go! 🚀"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;