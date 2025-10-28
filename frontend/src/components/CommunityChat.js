import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Globe } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommunityChat = ({ content, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [content]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const contentId = content ? content.id : null;
      const response = await axios.get(`${API}/community/messages?content_id=${contentId || ''}&limit=50`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!currentUser) {
      toast.error("Please create a profile to chat!");
      return;
    }

    setSending(true);
    try {
      const response = await axios.post(`${API}/community/messages`, {
        user_id: currentUser.id,
        message: newMessage.trim(),
        content_id: content ? content.id : null
      });

      setMessages([...messages, response.data]);
      setNewMessage("");
      toast.success("+15 points! 🎉");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border border-white/10 max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <MessageCircle className="w-6 h-6 text-[#ff6b35]" />
            <div>
              <div className="gradient-text">
                {content ? content.title : "Community Chat"}
              </div>
              {content && (
                <p className="text-xs text-gray-400 font-normal mt-1">
                  Discuss with other fans
                </p>
              )}
              {!content && (
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-400 font-normal">Global chat - talk about anything!</p>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    currentUser && msg.user_id === currentUser.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <img
                    src={msg.avatar}
                    alt={msg.username}
                    className="w-10 h-10 rounded-full border-2 border-white/20 flex-shrink-0"
                  />

                  {/* Message */}
                  <div
                    className={`flex-1 max-w-[70%] ${
                      currentUser && msg.user_id === currentUser.id ? 'text-right' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{msg.username}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`inline-block px-4 py-2 rounded-2xl ${
                        currentUser && msg.user_id === currentUser.id
                          ? 'bg-gradient-to-r from-[#ff6b35] to-[#ffa500] text-white'
                          : 'glass-card text-gray-200'
                      }`}
                    >
                      <p className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-white/10">
          <Input
            type="text"
            placeholder={currentUser ? "Type your message..." : "Create a profile to chat"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!currentUser || sending}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-500"
          />
          <Button
            type="submit"
            disabled={!currentUser || !newMessage.trim() || sending}
            className="bg-gradient-to-r from-[#ff6b35] to-[#ffa500] hover:from-[#ff8555] hover:to-[#ffb833] text-white px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>

        {!currentUser && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Create a profile to join the conversation and earn +15 points per message!
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommunityChat;