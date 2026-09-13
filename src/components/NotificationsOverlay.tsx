import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  CheckCheck, 
  Sparkles
} from "lucide-react";
import { triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";

export interface ActivityNotification {
  id: string;
  type: "LIKE" | "FOLLOW" | "COMMENT" | "VISIT";
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorPhoto?: string;
  targetId?: string;
  targetTitle?: string;
  targetImage?: string;
  commentText?: string;
  timestamp: string;
  timeGroup: "Today" | "Yesterday" | "This week" | "Earlier";
  isRead: boolean;
  isFollowing?: boolean;
}

const DEFAULT_NOTIFICATIONS: ActivityNotification[] = [
  {
    id: "notif-1",
    type: "LIKE",
    actorId: "critic_priya",
    actorName: "Priya Raman",
    actorUsername: "priya_eats",
    actorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    targetId: "dish-1",
    targetTitle: "Truffle Butter Chicken at Jewel of Nizam",
    targetImage: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=150&q=80",
    timestamp: "12m ago",
    timeGroup: "Today",
    isRead: false
  },
  {
    id: "notif-2",
    type: "FOLLOW",
    actorId: "critic_vikram",
    actorName: "Vikram Sethi",
    actorUsername: "vikram_critic",
    actorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    timestamp: "1h ago",
    timeGroup: "Today",
    isRead: false,
    isFollowing: false
  },
  {
    id: "notif-3",
    type: "COMMENT",
    actorId: "critic_ananya",
    actorName: "Ananya Roy",
    actorUsername: "ananya_foodie",
    actorPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    targetId: "craving-1",
    targetTitle: "Mutton Dum Biryani Craving",
    targetImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=150&q=80",
    commentText: "That spice blend looks unreal! Have you tried the double masala version?",
    timestamp: "3h ago",
    timeGroup: "Today",
    isRead: false
  },
  {
    id: "notif-4",
    type: "LIKE",
    actorId: "critic_karan",
    actorName: "Karan Mehta",
    actorUsername: "karan_bites",
    actorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    targetId: "review-2",
    targetTitle: "Guntur Chili Fish",
    targetImage: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=150&q=80",
    timestamp: "Yesterday",
    timeGroup: "Yesterday",
    isRead: true
  },
  {
    id: "notif-5",
    type: "FOLLOW",
    actorId: "critic_sneha",
    actorName: "Sneha Reddy",
    actorUsername: "sneha_gastronomy",
    actorPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    timestamp: "Yesterday",
    timeGroup: "Yesterday",
    isRead: true,
    isFollowing: true
  },
  {
    id: "notif-6",
    type: "VISIT",
    actorId: "madeater_bot",
    actorName: "Madeater Radar",
    actorUsername: "radar",
    actorPhoto: "",
    targetTitle: "Rayalaseema Ruchulu is trending in Banjara Hills",
    targetImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&q=80",
    timestamp: "3d ago",
    timeGroup: "This week",
    isRead: true
  },
  {
    id: "notif-7",
    type: "LIKE",
    actorId: "critic_rahul",
    actorName: "Rahul Sharma",
    actorUsername: "rahul_tasting",
    actorPhoto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    targetId: "review-3",
    targetTitle: "Filter Coffee & Idli Platter",
    targetImage: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=150&q=80",
    timestamp: "5d ago",
    timeGroup: "This week",
    isRead: true
  }
];

interface NotificationsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (unreadCount: number) => void;
}

export const NotificationsOverlay: React.FC<NotificationsOverlayProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"ALL" | "FOLLOWS" | "LIKES" | "COMMENTS">("ALL");
  const [notifications, setNotifications] = useState<ActivityNotification[]>(() => {
    try {
      const saved = localStorage.getItem("madeater_activity_notifications");
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("madeater_activity_notifications", JSON.stringify(notifications));
      const unread = notifications.filter(n => !n.isRead).length;
      onCountChange?.(unread);
    } catch (e) {
      console.error(e);
    }
  }, [notifications, onCountChange]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleMarkAllRead = () => {
    triggerHaptic();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleToggleFollow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const nextState = !n.isFollowing;
        toast.success(nextState ? `Following @${n.actorUsername}` : `Unfollowed @${n.actorUsername}`);
        return { ...n, isFollowing: nextState, isRead: true };
      }
      return n;
    }));
  };

  const handleNotificationClick = (notif: ActivityNotification) => {
    triggerHaptic();
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    onClose();

    if (notif.type === "FOLLOW") {
      navigate(`/app/profile/${notif.actorUsername}`);
    } else if (notif.targetId) {
      navigate(`/app/profile/${notif.actorUsername}`);
    } else {
      navigate("/app/feed");
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === "FOLLOWS") return n.type === "FOLLOW";
    if (filter === "LIKES") return n.type === "LIKE";
    if (filter === "COMMENTS") return n.type === "COMMENT";
    return true;
  });

  const timeGroups: Array<"Today" | "Yesterday" | "This week" | "Earlier"> = [
    "Today",
    "Yesterday",
    "This week",
    "Earlier"
  ];

  const unreadTotal = notifications.filter(n => !n.isRead).length;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden pointer-events-auto bg-black select-none">
      <div className="relative w-full h-full md:max-w-xl md:h-[92vh] md:rounded-3xl bg-[#09090b] text-white border-0 md:border md:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Instagram Header */}
        <div className="sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-xl px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <button 
              type="button"
              onClick={() => {
                triggerHaptic();
                onClose();
              }} 
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft size={22} className="stroke-[2.2]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate flex items-center gap-2">
              Notifications
              {unreadTotal > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </h1>
          </div>

          {unreadTotal > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck size={14} className="text-orange-400" />
              <span>Read all</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
          {(["ALL", "LIKES", "COMMENTS", "FOLLOWS"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                triggerHaptic();
                setFilter(tab);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all shrink-0 cursor-pointer ${
                filter === tab 
                  ? "bg-white text-black shadow-md font-bold" 
                  : "bg-[#18181b] text-zinc-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              {tab === "ALL" ? "All Activity" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Notifications Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 scrollbar-hide">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-zinc-500">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                <Heart size={22} className="stroke-1" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">No activity yet</p>
              <p className="text-xs text-zinc-500 max-w-xs">
                When critics like your food reviews or start following you, you'll see them here.
              </p>
            </div>
          ) : (
            timeGroups.map(group => {
              const groupItems = filtered.filter(n => n.timeGroup === group);
              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 px-1 pt-1 tracking-tight">
                    {group}
                  </h3>

                  <div className="space-y-1">
                    {groupItems.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                          !notif.isRead 
                            ? "bg-gradient-to-r from-orange-500/10 via-rose-500/5 to-transparent border border-orange-500/20" 
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {notif.actorPhoto ? (
                            <img
                              src={notif.actorPhoto}
                              alt={notif.actorName}
                              className="w-11 h-11 rounded-full object-cover border border-white/15"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm">
                              {notif.actorName.charAt(0)}
                            </div>
                          )}

                          {/* Type Badge */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#09090b] text-white text-[10px]">
                            {notif.type === "LIKE" && (
                              <div className="w-full h-full rounded-full bg-rose-500 flex items-center justify-center">
                                <Heart size={10} className="fill-white" />
                              </div>
                            )}
                            {notif.type === "FOLLOW" && (
                              <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center">
                                <UserPlus size={10} />
                              </div>
                            )}
                            {notif.type === "COMMENT" && (
                              <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center">
                                <MessageSquare size={10} className="fill-white" />
                              </div>
                            )}
                            {notif.type === "VISIT" && (
                              <div className="w-full h-full rounded-full bg-amber-500 flex items-center justify-center">
                                <Sparkles size={10} className="fill-white text-black" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content text */}
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="text-xs text-zinc-200 leading-snug">
                            <span className="font-bold text-white hover:underline">
                              {notif.actorUsername || notif.actorName}
                            </span>{" "}
                            {notif.type === "LIKE" && "liked your review of "}
                            {notif.type === "FOLLOW" && "started following you."}
                            {notif.type === "COMMENT" && "commented: "}
                            {notif.type === "VISIT" && "Trending: "}
                            
                            {notif.commentText ? (
                              <span className="text-zinc-300 italic">
                                "{notif.commentText.length > 50 ? notif.commentText.slice(0, 50) + '...' : notif.commentText}"
                              </span>
                            ) : notif.targetTitle ? (
                              <span className="font-medium text-white/90">
                                {notif.targetTitle}
                              </span>
                            ) : null}
                            
                            <span className="text-zinc-500 text-[11px] ml-1.5 whitespace-nowrap">
                              {notif.timestamp}
                            </span>
                          </p>
                        </div>

                        {/* Right side: Follow button or post thumbnail */}
                        <div className="shrink-0">
                          {notif.type === "FOLLOW" ? (
                            <button
                              type="button"
                              onClick={(e) => handleToggleFollow(notif.id, e)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                notif.isFollowing
                                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10"
                                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                              }`}
                            >
                              {notif.isFollowing ? "Following" : "Follow"}
                            </button>
                          ) : notif.targetImage ? (
                            <img
                              src={notif.targetImage}
                              alt="Thumbnail"
                              className="w-10 h-10 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};
