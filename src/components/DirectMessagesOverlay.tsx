import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Send, 
  Search, 
  SquarePen, 
  Image as ImageIcon, 
  Heart, 
  Sparkles, 
  MapPin, 
  Utensils, 
  Star, 
  ChevronRight,
  X
} from "lucide-react";
import { useAuth } from "../App";
import { triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";

export interface SharedDishData {
  dishName: string;
  restaurantName: string;
  restaurantId: string;
  image?: string;
  rating?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  sharedDish?: SharedDishData;
  timestamp: string;
  isMe: boolean;
}

export interface ChatThread {
  id: string;
  criticId: string;
  criticName: string;
  criticUsername: string;
  criticPhoto?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
}

const DEFAULT_THREADS: ChatThread[] = [
  {
    id: "thread_priya",
    criticId: "priya_eats",
    criticName: "Priya Raman",
    criticUsername: "priya_eats",
    criticPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    lastMessage: "Have you tried the new mandi place near Jubilee Hills? 🤤",
    lastTimestamp: "14m",
    unreadCount: 1,
    messages: [
      {
        id: "m1",
        senderId: "priya_eats",
        text: "Hey! Loved your recent review on the Dum Biryani!",
        timestamp: "Yesterday 9:15 PM",
        isMe: false
      },
      {
        id: "m2",
        senderId: "me",
        text: "Thanks Priya! The spice blend was truly phenomenal.",
        timestamp: "Yesterday 9:20 PM",
        isMe: true
      },
      {
        id: "m3",
        senderId: "priya_eats",
        text: "Have you tried the new mandi place near Jubilee Hills? 🤤",
        timestamp: "14m ago",
        isMe: false
      }
    ]
  },
  {
    id: "thread_vikram",
    criticId: "vikram_critic",
    criticName: "Vikram Sethi",
    criticUsername: "vikram_critic",
    criticPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    lastMessage: "Shared a dish: Truffle Butter Chicken",
    lastTimestamp: "2h",
    unreadCount: 0,
    messages: [
      {
        id: "m4",
        senderId: "vikram_critic",
        text: "Check out what I had for dinner today. Absolute 10/10!",
        sharedDish: {
          dishName: "Truffle Butter Chicken",
          restaurantName: "Jewel of Nizam",
          restaurantId: "rest-1",
          image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=300&q=80",
          rating: 4.9
        },
        timestamp: "2h ago",
        isMe: false
      },
      {
        id: "m5",
        senderId: "me",
        text: "Wow, that looks incredible! Adding to my Eatlist now.",
        timestamp: "1h ago",
        isMe: true
      }
    ]
  },
  {
    id: "thread_ananya",
    criticId: "ananya_foodie",
    criticName: "Ananya Roy",
    criticUsername: "ananya_foodie",
    criticPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    lastMessage: "Let's do a food crawl this Saturday!",
    lastTimestamp: "1d",
    unreadCount: 0,
    messages: [
      {
        id: "m6",
        senderId: "ananya_foodie",
        text: "Let's do a food crawl this Saturday! I want to hit 3 street food spots in Old City.",
        timestamp: "Yesterday",
        isMe: false
      }
    ]
  }
];

interface DirectMessagesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
  initialSharedDish?: SharedDishData;
}

export const DirectMessagesOverlay: React.FC<DirectMessagesOverlayProps> = ({
  isOpen,
  onClose,
  onUnreadChange,
  initialSharedDish
}) => {
  const { user, dishdUser } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem("madeater_dm_threads");
      return saved ? JSON.parse(saved) : DEFAULT_THREADS;
    } catch {
      return DEFAULT_THREADS;
    }
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync unread count
  useEffect(() => {
    try {
      localStorage.setItem("madeater_dm_threads", JSON.stringify(threads));
      const totalUnread = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
      onUnreadChange?.(totalUnread);
    } catch (e) {
      console.error(e);
    }
  }, [threads, onUnreadChange]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (activeThreadId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThreadId, threads]);

  useEffect(() => {
    if (!isOpen) {
      setActiveThreadId(null);
      setSearchQuery("");
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeThreadId) setActiveThreadId(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeThreadId, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleOpenThread = (threadId: string) => {
    triggerHaptic();
    setActiveThreadId(threadId);
    // Mark thread as read
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t));
  };

  const handleSendMessage = () => {
    if (!inputText.trim() && !initialSharedDish) return;
    if (!activeThreadId) return;

    triggerHaptic();
    const newMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      senderId: "me",
      text: inputText.trim(),
      sharedDish: initialSharedDish,
      timestamp: "Just now",
      isMe: true
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          lastMessage: inputText.trim() || (initialSharedDish ? `Shared a dish: ${initialSharedDish.dishName}` : ""),
          lastTimestamp: "Just now",
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    setInputText("");

    // Simulate realistic critic reply after 1.5s
    const targetThread = threads.find(t => t.id === activeThreadId);
    if (targetThread) {
      setTimeout(() => {
        const replies = [
          "That sounds so tempting! Definitely trying it out this week.",
          "Awesome! I'll add that to my radar. Thanks for sharing!",
          "100% agreed! The flavor profile on that is unbeatable.",
          "Let's go together next time, I know the head chef there!"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        setThreads(curr => curr.map(t => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              lastMessage: randomReply,
              lastTimestamp: "Just now",
              messages: [
                ...t.messages,
                {
                  id: "reply_" + Date.now(),
                  senderId: targetThread.criticId,
                  text: randomReply,
                  timestamp: "Just now",
                  isMe: false
                }
              ]
            };
          }
          return t;
        }));
      }, 1500);
    }
  };

  const filteredThreads = threads.filter(t => 
    t.criticName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.criticUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden pointer-events-auto bg-black select-none">
      <div className="relative w-full h-full md:max-w-xl md:h-[92vh] md:rounded-3xl bg-[#09090b] text-white border-0 md:border md:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* ========================================================== */}
        {/* HEADER */}
        {/* ========================================================== */}
        <div className="sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-xl px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              type="button"
              onClick={() => {
                triggerHaptic();
                if (activeThreadId) setActiveThreadId(null);
                else onClose();
              }} 
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft size={22} className="stroke-[2.2]" />
            </button>

            {activeThread ? (
              <div 
                onClick={() => {
                  triggerHaptic();
                  onClose();
                  navigate(`/app/profile/${activeThread.criticUsername}`);
                }}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={activeThread.criticPhoto}
                  alt={activeThread.criticName}
                  className="w-8 h-8 rounded-full object-cover border border-white/15"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate leading-tight">
                    {activeThread.criticName}
                  </h2>
                  <p className="text-[11px] text-zinc-400 truncate">
                    @{activeThread.criticUsername}
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate flex items-center gap-2">
                <span>@{dishdUser?.username || user?.displayName?.toLowerCase().replace(/\s+/g, '_') || "critic"}</span>
                <span className="text-xs font-normal text-zinc-400">· Messages</span>
              </h1>
            )}
          </div>

          {!activeThread && (
            <button
              onClick={() => toast.info("New foodie chat composer")}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
              title="New message"
            >
              <SquarePen size={18} />
            </button>
          )}
        </div>

        {/* ========================================================== */}
        {/* VIEW 1: THREADS LIST */}
        {/* ========================================================== */}
        {!activeThread && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
            
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food critics & messages"
                className="w-full bg-[#18181b] border border-white/[0.08] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            {/* Section label */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-zinc-400">Messages</span>
              <span className="text-xs text-orange-400 font-medium">Foodie Inquiries</span>
            </div>

            {/* List */}
            <div className="space-y-1 divide-y divide-white/[0.04]">
              {filteredThreads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => handleOpenThread(thread.id)}
                  className="w-full py-3 px-2 flex items-center justify-between hover:bg-white/[0.04] rounded-2xl cursor-pointer transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={thread.criticPhoto}
                        alt={thread.criticName}
                        className="w-12 h-12 rounded-full object-cover border border-white/15"
                      />
                      {thread.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-[#09090b]" />
                      )}
                    </div>

                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {thread.criticName}
                        </span>
                        <span className="text-[11px] text-zinc-500 shrink-0">
                          · {thread.lastTimestamp}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${
                        thread.unreadCount > 0 ? "font-bold text-white" : "text-zinc-400"
                      }`}>
                        {thread.lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {thread.unreadCount > 0 ? (
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                    ) : (
                      <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: ACTIVE CONVERSATION CHAT */}
        {/* ========================================================== */}
        {activeThread && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
              {activeThread.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                >
                  {/* Shared Dish Card inside Chat Bubble */}
                  {msg.sharedDish && (
                    <div 
                      onClick={() => {
                        triggerHaptic();
                        onClose();
                        navigate(`/restaurant/${msg.sharedDish?.restaurantId}`);
                      }}
                      className="mb-1.5 max-w-xs rounded-2xl overflow-hidden border border-white/15 bg-zinc-900 shadow-xl cursor-pointer hover:border-orange-500/50 transition-all active:scale-[0.98]"
                    >
                      {msg.sharedDish.image && (
                        <img
                          src={msg.sharedDish.image}
                          alt={msg.sharedDish.dishName}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white truncate">
                            {msg.sharedDish.dishName}
                          </span>
                          {msg.sharedDish.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                              <Star size={12} fill="currentColor" /> {msg.sharedDish.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <MapPin size={11} className="text-orange-400" />
                          <span>{msg.sharedDish.restaurantName}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Text Bubble */}
                  {msg.text && (
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.isMe
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-sm shadow-md font-medium"
                          : "bg-[#27272a] text-zinc-100 rounded-bl-sm border border-white/[0.05]"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-500 px-1 mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-white/[0.08] bg-[#09090b]/95 backdrop-blur-md flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.info("Photo sharing")}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Message..."
                className="flex-1 bg-[#18181b] border border-white/[0.08] rounded-full px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  inputText.trim() 
                    ? "bg-orange-500 text-white active:scale-90 shadow-md" 
                    : "text-zinc-600 pointer-events-none"
                }`}
              >
                <Send size={16} />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
