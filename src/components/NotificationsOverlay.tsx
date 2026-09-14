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
import { useAuth } from "../App";
import { triggerHaptic } from "../services/nativeService";
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  subscribeToNotifications,
  toggleFollow
} from "../services/supabaseService";
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

function formatNotificationItem(n: any, followingList: string[] = []): ActivityNotification {
  const createdDate = new Date(n.created_at || n.createdAt || Date.now());
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let timestamp = "Just now";
  if (diffMins < 1) timestamp = "Just now";
  else if (diffMins < 60) timestamp = `${diffMins}m ago`;
  else if (diffHours < 24) timestamp = `${diffHours}h ago`;
  else if (diffDays === 1) timestamp = "Yesterday";
  else timestamp = `${diffDays}d ago`;

  let timeGroup: ActivityNotification["timeGroup"] = "Today";
  if (diffDays === 0) timeGroup = "Today";
  else if (diffDays === 1) timeGroup = "Yesterday";
  else if (diffDays <= 7) timeGroup = "This week";
  else timeGroup = "Earlier";

  const actorId = n.sender_id || n.actorId || "";
  const actorName = n.sender_name || n.actorName || "Critic";
  const actorUsername = n.sender_username || actorName.toLowerCase().replace(/\s+/g, '_');

  return {
    id: n.id,
    type: (n.type?.toUpperCase() || "LIKE") as any,
    actorId,
    actorName,
    actorUsername,
    actorPhoto: n.sender_photo || n.actorPhoto || "",
    targetId: n.target_id || n.targetId,
    targetTitle: n.target_title || n.message || undefined,
    targetImage: n.target_image,
    commentText: n.comment_text || n.commentText,
    timestamp,
    timeGroup,
    isRead: !!(n.is_read || n.read),
    isFollowing: followingList.includes(actorId)
  };
}

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
  const { user: currentUser, dishdUser } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"ALL" | "FOLLOWS" | "LIKES" | "COMMENTS">("ALL");
  const [notifications, setNotifications] = useState<ActivityNotification[]>(() => {
    // Purge any old fake mock notifications cache
    try {
      const oldCache = localStorage.getItem("madeater_activity_notifications");
      if (oldCache && oldCache.includes("critic_priya")) {
        localStorage.removeItem("madeater_activity_notifications");
      }
      if (currentUser?.uid) {
        const saved = localStorage.getItem(`madeater_real_notifications_${currentUser.uid}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  // Load real notifications from Supabase
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      onCountChange?.(0);
      return;
    }

    const following = dishdUser?.stats?.followingList || [];

    const loadRealNotifications = async () => {
      try {
        const raw = await getNotifications(currentUser.uid);
        const mapped = raw.map(n => formatNotificationItem(n, following));
        setNotifications(mapped);
        localStorage.setItem(`madeater_real_notifications_${currentUser.uid}`, JSON.stringify(mapped));
        const unread = mapped.filter(n => !n.isRead).length;
        onCountChange?.(unread);
      } catch (err) {
        console.warn("[Notifications] Fetch error:", err);
      }
    };

    loadRealNotifications();

    const sub = subscribeToNotifications(currentUser.uid, (raw) => {
      const mapped = raw.map(n => formatNotificationItem(n, following));
      setNotifications(mapped);
      localStorage.setItem(`madeater_real_notifications_${currentUser.uid}`, JSON.stringify(mapped));
      const unread = mapped.filter(n => !n.isRead).length;
      onCountChange?.(unread);
    });

    const handleNewNotification = (e: any) => {
      const notifData = e.detail;
      if (notifData && notifData.recipient_id === currentUser.uid) {
        loadRealNotifications();
      }
    };

    window.addEventListener('madeater_new_notification', handleNewNotification);

    return () => {
      sub.unsubscribe();
      window.removeEventListener('madeater_new_notification', handleNewNotification);
    };
  }, [currentUser?.uid, dishdUser?.stats?.followingList, onCountChange]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    onCountChange?.(unread);
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
    if (currentUser?.uid) {
      markAllNotificationsRead(currentUser.uid);
      try {
        localStorage.setItem(`madeater_real_notifications_${currentUser.uid}`, JSON.stringify(notifications.map(n => ({ ...n, isRead: true }))));
      } catch {}
    }
    toast.success("All notifications marked as read");
  };

  const handleToggleFollow = async (notif: ActivityNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    triggerHaptic();
    const nextState = !notif.isFollowing;
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isFollowing: nextState, isRead: true } : n));
    try {
      await toggleFollow(currentUser.uid, notif.actorId, !!notif.isFollowing, {
        name: currentUser.displayName || undefined,
        photo: currentUser.photoURL || undefined
      });
      toast.success(nextState ? `Following @${notif.actorUsername}` : `Unfollowed @${notif.actorUsername}`);
    } catch {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isFollowing: notif.isFollowing } : n));
    }
  };

  const handleNotificationClick = (notif: ActivityNotification) => {
    triggerHaptic();
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    if (currentUser?.uid) {
      markNotificationRead(notif.id);
    }
    onClose();

    if (notif.actorUsername) {
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
                              onClick={(e) => handleToggleFollow(notif, e)}
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
