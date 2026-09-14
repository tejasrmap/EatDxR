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
  X,
  MessageSquare,
  Users
} from "lucide-react";
import { useAuth } from "../App";
import { triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";
import { 
  sendDirectMessage, 
  getDirectMessages, 
  markDirectMessagesRead, 
  subscribeToDirectMessages, 
  searchProfiles, 
  getTopCritics,
  DirectMessageRow 
} from "../services/supabaseService";
import { User } from "../types";

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

interface DirectMessagesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
  initialSharedDish?: SharedDishData;
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export const DirectMessagesOverlay: React.FC<DirectMessagesOverlayProps> = ({
  isOpen,
  onClose,
  onUnreadChange,
  initialSharedDish
}) => {
  const { user, dishdUser } = useAuth();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Chat Composer State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerSearch, setComposerSearch] = useState("");
  const [composerResults, setComposerResults] = useState<User[]>([]);
  const [suggestedCritics, setSuggestedCritics] = useState<User[]>([]);
  const [isSearchingCritics, setIsSearchingCritics] = useState(false);

  // Helper to convert rows into grouped threads
  const buildThreadsFromRows = (rows: DirectMessageRow[], currentUserId: string): ChatThread[] => {
    const threadMap = new Map<string, {
      criticId: string;
      criticName: string;
      criticUsername: string;
      criticPhoto: string;
      messages: ChatMessage[];
      unreadCount: number;
    }>();

    for (const row of rows) {
      const isMe = row.sender_id === currentUserId;
      const partnerId = isMe ? row.recipient_id : row.sender_id;
      const partnerName = isMe ? (row.recipient_name || "Food Critic") : (row.sender_name || "Food Critic");
      const partnerPhoto = isMe ? (row.recipient_photo || "") : (row.sender_photo || "");
      const partnerUsername = partnerName.toLowerCase().replace(/\s+/g, "_");

      if (!threadMap.has(partnerId)) {
        threadMap.set(partnerId, {
          criticId: partnerId,
          criticName: partnerName,
          criticUsername: partnerUsername,
          criticPhoto: partnerPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${partnerId}`,
          messages: [],
          unreadCount: 0
        });
      }

      const t = threadMap.get(partnerId)!;
      if (!isMe && !row.is_read) {
        t.unreadCount += 1;
      }

      t.messages.push({
        id: row.id,
        senderId: row.sender_id,
        text: row.text,
        sharedDish: row.shared_dish,
        timestamp: formatRelativeTime(row.created_at),
        isMe
      });
    }

    const result: ChatThread[] = [];
    threadMap.forEach((val, partnerId) => {
      const lastMsgObj = val.messages[val.messages.length - 1];
      const lastText = lastMsgObj?.text || (lastMsgObj?.sharedDish ? `Shared a dish: ${lastMsgObj.sharedDish.dishName}` : "Started a conversation");
      const lastTime = lastMsgObj?.timestamp || "";

      result.push({
        id: partnerId,
        criticId: val.criticId,
        criticName: val.criticName,
        criticUsername: val.criticUsername,
        criticPhoto: val.criticPhoto,
        lastMessage: lastText,
        lastTimestamp: lastTime,
        unreadCount: val.unreadCount,
        messages: val.messages
      });
    });

    return result;
  };

  // 1. Clear any legacy mock cache on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("madeater_dm_threads");
      if (raw && (raw.includes("priya_eats") || raw.includes("thread_priya") || raw.includes("vikram_critic"))) {
        localStorage.removeItem("madeater_dm_threads");
      }
    } catch {}
  }, []);

  // 2. Load and subscribe to real Direct Messages
  useEffect(() => {
    if (!user?.uid) return;

    // Load initial messages
    getDirectMessages(user.uid).then((rows) => {
      const built = buildThreadsFromRows(rows, user.uid);
      setThreads(built);
    }).catch((err) => {
      console.warn("[DirectMessages] Error loading DMs:", err);
    });

    // Realtime subscription
    const sub = subscribeToDirectMessages(user.uid, (rows) => {
      const built = buildThreadsFromRows(rows, user.uid);
      setThreads(built);
    });

    return () => {
      sub?.unsubscribe();
    };
  }, [user?.uid]);

  // 3. Load Suggested Critics for the composer
  useEffect(() => {
    if (!isOpen) return;
    getTopCritics(10).then((critics) => {
      setSuggestedCritics(critics.filter(c => c.uid !== user?.uid));
    }).catch(() => {});
  }, [isOpen, user?.uid]);

  // 4. Handle Composer Search Query
  useEffect(() => {
    if (!composerSearch.trim()) {
      setComposerResults([]);
      setIsSearchingCritics(false);
      return;
    }

    setIsSearchingCritics(true);
    const timer = setTimeout(() => {
      searchProfiles(composerSearch.trim()).then((results) => {
        setComposerResults(results.filter(r => r.uid !== user?.uid));
        setIsSearchingCritics(false);
      }).catch(() => {
        setIsSearchingCritics(false);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [composerSearch, user?.uid]);

  // 5. Sync unread count to parent header
  useEffect(() => {
    const totalUnread = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
    onUnreadChange?.(totalUnread);
  }, [threads, onUnreadChange]);

  // Scroll to bottom on new message or thread opening
  useEffect(() => {
    if (activeThreadId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThreadId, threads]);

  // Handle escape and scroll locks
  useEffect(() => {
    if (!isOpen) {
      setActiveThreadId(null);
      setSearchQuery("");
      setIsComposerOpen(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isComposerOpen) setIsComposerOpen(false);
        else if (activeThreadId) setActiveThreadId(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeThreadId, isComposerOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleOpenThread = (threadId: string) => {
    triggerHaptic();
    setActiveThreadId(threadId);
    if (user?.uid) {
      markDirectMessagesRead(user.uid, threadId);
    }
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t));
  };

  const handleStartChatWithCritic = (critic: User) => {
    triggerHaptic();
    setIsComposerOpen(false);
    setComposerSearch("");

    // Check if thread already exists
    const existing = threads.find(t => t.criticId === critic.uid);
    if (existing) {
      handleOpenThread(existing.id);
      return;
    }

    // Create a new empty thread
    const newThread: ChatThread = {
      id: critic.uid,
      criticId: critic.uid,
      criticName: critic.displayName || critic.username || "Food Critic",
      criticUsername: critic.username || critic.displayName?.toLowerCase().replace(/\s+/g, '_') || "critic",
      criticPhoto: critic.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${critic.uid}`,
      lastMessage: "Start a conversation",
      lastTimestamp: "Just now",
      unreadCount: 0,
      messages: []
    };

    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(critic.uid);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !initialSharedDish) return;
    if (!activeThread || !user?.uid) return;

    triggerHaptic();
    const textToSend = inputText.trim();
    setInputText("");

    const myName = dishdUser?.displayName || user.displayName || "Food Critic";
    const myPhoto = dishdUser?.photoURL || user.photoURL || "";

    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.uid,
      text: textToSend,
      sharedDish: initialSharedDish,
      timestamp: "Just now",
      isMe: true
    };

    // Optimistically update UI
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          lastMessage: textToSend || (initialSharedDish ? `Shared a dish: ${initialSharedDish.dishName}` : ""),
          lastTimestamp: "Just now",
          messages: [...t.messages, optimisticMsg]
        };
      }
      return t;
    }));

    // Send real direct message to Supabase & local storage
    try {
      await sendDirectMessage({
        senderId: user.uid,
        senderName: myName,
        senderPhoto: myPhoto,
        recipientId: activeThread.criticId,
        recipientName: activeThread.criticName,
        recipientPhoto: activeThread.criticPhoto,
        text: textToSend,
        sharedDish: initialSharedDish
      });
    } catch (err) {
      console.error("[DirectMessages] Failed to send message:", err);
      toast.error("Message delivery failed. Please check connection.");
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
                if (isComposerOpen) setIsComposerOpen(false);
                else if (activeThreadId) setActiveThreadId(null);
                else onClose();
              }} 
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft size={22} className="stroke-[2.2]" />
            </button>

            {isComposerOpen ? (
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                New Foodie Chat
              </h1>
            ) : activeThread ? (
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

          {!activeThread && !isComposerOpen && (
            <button
              onClick={() => {
                triggerHaptic();
                setIsComposerOpen(true);
              }}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
              title="New message"
            >
              <SquarePen size={18} />
            </button>
          )}

          {isComposerOpen && (
            <button
              onClick={() => setIsComposerOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ========================================================== */}
        {/* VIEW 0: COMPOSER MODAL (Search real users & top critics)    */}
        {/* ========================================================== */}
        {isComposerOpen && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={composerSearch}
                onChange={(e) => setComposerSearch(e.target.value)}
                placeholder="Search food critics by name or username..."
                className="w-full bg-[#18181b] border border-white/[0.08] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>

            {/* If searching */}
            {composerSearch.trim() && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400">Search Results</span>
                {isSearchingCritics ? (
                  <div className="py-8 text-center text-xs text-zinc-500">Searching critics...</div>
                ) : composerResults.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">No food critics found matching "{composerSearch}"</div>
                ) : (
                  <div className="space-y-1">
                    {composerResults.map((critic) => (
                      <div
                        key={critic.uid}
                        onClick={() => handleStartChatWithCritic(critic)}
                        className="w-full py-2.5 px-3 flex items-center justify-between hover:bg-white/[0.06] rounded-2xl cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={critic.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${critic.uid}`}
                            alt={critic.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{critic.displayName}</p>
                            <p className="text-xs text-zinc-400 truncate">@{critic.username || "critic"}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">
                          Chat
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggested Top Critics */}
            {!composerSearch.trim() && suggestedCritics.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                  <Users size={14} className="text-orange-400" />
                  <span>Suggested Critics</span>
                </span>
                <div className="space-y-1 divide-y divide-white/[0.04]">
                  {suggestedCritics.map((critic) => (
                    <div
                      key={critic.uid}
                      onClick={() => handleStartChatWithCritic(critic)}
                      className="w-full py-2.5 px-3 flex items-center justify-between hover:bg-white/[0.06] rounded-2xl cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={critic.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${critic.uid}`}
                          alt={critic.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{critic.displayName}</p>
                          <p className="text-xs text-zinc-400 truncate">@{critic.username || "critic"}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">
                        Chat
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 1: THREADS LIST                                      */}
        {/* ========================================================== */}
        {!activeThread && !isComposerOpen && (
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
              <span className="text-xs font-bold text-zinc-400">Direct Messages</span>
              <span className="text-xs text-orange-400 font-medium">Foodie Inquiries</span>
            </div>

            {/* Empty State */}
            {filteredThreads.length === 0 && (
              <div className="py-14 text-center space-y-4 bg-[#141417]/60 border border-white/[0.06] rounded-3xl p-6">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
                  <MessageSquare size={22} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">No messages yet</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Start a conversation with verified food critics, ask for dish recommendations, or plan a food crawl!
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsComposerOpen(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <SquarePen size={14} />
                  <span>Start a Chat</span>
                </button>
              </div>
            )}

            {/* List */}
            {filteredThreads.length > 0 && (
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
                          {thread.lastTimestamp && (
                            <span className="text-[11px] text-zinc-500 shrink-0">
                              · {thread.lastTimestamp}
                            </span>
                          )}
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
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: ACTIVE CONVERSATION CHAT                          */}
        {/* ========================================================== */}
        {activeThread && !isComposerOpen && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
              {activeThread.messages.length === 0 && (
                <div className="py-12 text-center text-xs text-zinc-500 space-y-1">
                  <p className="font-semibold text-zinc-400">Conversation started with {activeThread.criticName}</p>
                  <p>Send a message or recommend a dish to kick off the discussion!</p>
                </div>
              )}

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
                onClick={() => toast.info("Attach dish or review directly from restaurant cards")}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Message ${activeThread.criticName}...`}
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
