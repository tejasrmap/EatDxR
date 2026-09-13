import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Search,
  Bookmark,
  History,
  Activity,
  Bell,
  Clock,
  Lock,
  Star,
  Ban,
  MessageCircle,
  MessageSquare,
  AtSign,
  Share2,
  ShieldCheck,
  Sun,
  Moon,
  Smartphone,
  Download,
  Accessibility,
  Volume2,
  BarChart2,
  HelpCircle,
  FileText,
  UserPlus,
  LogOut,
  Trash2,
  ChevronRight,
  X,
  User,
  Layers,
  Radio,
  Users,
  UserX,
  SlidersHorizontal,
  Type,
  VolumeX,
  Heart,
  Sliders,
  Sparkles,
  Shield,
  Dna,
  Check,
  Flame,
  Utensils,
  CheckCircle2,
  BellOff
} from "lucide-react";
import { useAuth } from "../App";
import { useTheme } from "./ThemeProvider";
import { triggerHaptic, isNative } from "../services/nativeService";
import { toast } from "sonner";

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
}

interface SettingItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  value?: string;
  badge?: string;
  isDestructive?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

type SubView = null | "account_privacy" | "close_friends" | "notifications" | "like_counts" | "content_preferences";

// Sample critics for Close Friends picker
const CRITICS_LIST = [
  { id: "priya_eats", name: "Priya Raman", username: "priya_eats", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
  { id: "vikram_critic", name: "Vikram Sethi", username: "vikram_critic", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: "ananya_foodie", name: "Ananya Roy", username: "ananya_foodie", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" },
  { id: "karan_bites", name: "Karan Mehta", username: "karan_bites", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
  { id: "sneha_gastronomy", name: "Sneha Reddy", username: "sneha_gastronomy", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
  { id: "rahul_tasting", name: "Rahul Sharma", username: "rahul_tasting", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80" },
  { id: "arjun_palate", name: "Arjun Kapoor", username: "arjun_palate", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" },
  { id: "divya_michelin", name: "Divya Nambiar", username: "divya_michelin", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
  { id: "rohit_streetfood", name: "Rohit Verma", username: "rohit_streetfood", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" },
  { id: "meera_spice", name: "Meera Iyer", username: "meera_spice", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80" }
];

const DEFAULT_CLOSE_FRIENDS = ["priya_eats", "vikram_critic", "ananya_foodie"];

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ 
  isOpen, 
  onClose,
  onEditProfile
}) => {
  const { user, dishdUser, logout, openAuthModal } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubView, setActiveSubView] = useState<SubView>(null);

  // 1. Account Privacy State
  const [isPrivate, setIsPrivate] = useState<boolean>(() => {
    return localStorage.getItem("madeater_account_privacy") === "private";
  });

  // 2. Close Friends State
  const [closeFriends, setCloseFriends] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("madeater_close_friends");
      return saved ? JSON.parse(saved) : DEFAULT_CLOSE_FRIENDS;
    } catch {
      return DEFAULT_CLOSE_FRIENDS;
    }
  });
  const [friendSearch, setFriendSearch] = useState("");

  // 3. Notifications Config State
  const [notifConfig, setNotifConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("madeater_notifications_config");
      return saved ? JSON.parse(saved) : {
        pauseAll: false,
        likes: true,
        comments: true,
        newFollowers: true,
        nearbyDrops: true,
        mealReminders: true
      };
    } catch {
      return {
        pauseAll: false,
        likes: true,
        comments: true,
        newFollowers: true,
        nearbyDrops: true,
        mealReminders: true
      };
    }
  });

  // 4. Like & Share Counts State
  const [hideLikeCounts, setHideLikeCounts] = useState<boolean>(() => {
    return localStorage.getItem("madeater_hide_like_counts") === "true";
  });

  // 5. Content Preferences State
  const [contentPrefs, setContentPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("madeater_content_preferences");
      return saved ? JSON.parse(saved) : {
        dietary: ["Halal", "Non-Veg"],
        spiceTolerance: "Spicy",
        preferredCuisines: ["Biryani & Hyderabadi", "South Indian", "Pan-Asian"]
      };
    } catch {
      return {
        dietary: ["Halal", "Non-Veg"],
        spiceTolerance: "Spicy",
        preferredCuisines: ["Biryani & Hyderabadi", "South Indian", "Pan-Asian"]
      };
    }
  });

  useEffect(() => {
    if (!isOpen) {
      setActiveSubView(null);
      setSearchQuery("");
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeSubView) {
          setActiveSubView(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeSubView, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const username = dishdUser?.username || user?.displayName?.toLowerCase().replace(/\s+/g, "_") || "critic";
  const userPhoto = dishdUser?.photoURL || user?.photoURL;

  // Handlers for the 5 full-fledged settings
  const handleTogglePrivacy = () => {
    triggerHaptic();
    const nextVal = !isPrivate;
    setIsPrivate(nextVal);
    localStorage.setItem("madeater_account_privacy", nextVal ? "private" : "public");
    window.dispatchEvent(new Event("storage"));
    toast.success(nextVal ? "Account set to Private" : "Account set to Public");
  };

  const handleToggleCloseFriend = (criticId: string) => {
    triggerHaptic();
    setCloseFriends(prev => {
      const next = prev.includes(criticId) ? prev.filter(id => id !== criticId) : [...prev, criticId];
      localStorage.setItem("madeater_close_friends", JSON.stringify(next));
      return next;
    });
  };

  const handleToggleNotifKey = (key: string) => {
    triggerHaptic();
    setNotifConfig((prev: any) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("madeater_notifications_config", JSON.stringify(next));
      toast.success("Notification preferences updated");
      return next;
    });
  };

  const handleToggleHideLikeCounts = () => {
    triggerHaptic();
    const nextVal = !hideLikeCounts;
    setHideLikeCounts(nextVal);
    localStorage.setItem("madeater_hide_like_counts", nextVal ? "true" : "false");
    window.dispatchEvent(new Event("madeater_like_counts_changed"));
    toast.success(nextVal ? "Like and view counts hidden" : "Like and view counts visible");
  };

  const handleToggleDietary = (rule: string) => {
    triggerHaptic();
    setContentPrefs((prev: any) => {
      const currentDietary: string[] = prev.dietary || [];
      const nextDietary = currentDietary.includes(rule)
        ? currentDietary.filter(r => r !== rule)
        : [...currentDietary, rule];
      const next = { ...prev, dietary: nextDietary };
      localStorage.setItem("madeater_content_preferences", JSON.stringify(next));
      return next;
    });
  };

  const handleSelectSpice = (spice: string) => {
    triggerHaptic();
    setContentPrefs((prev: any) => {
      const next = { ...prev, spiceTolerance: spice };
      localStorage.setItem("madeater_content_preferences", JSON.stringify(next));
      toast.success(`Spice tolerance set to ${spice}`);
      return next;
    });
  };

  const handleToggleCuisine = (cuisine: string) => {
    triggerHaptic();
    setContentPrefs((prev: any) => {
      const currentCuisines: string[] = prev.preferredCuisines || [];
      const nextCuisines = currentCuisines.includes(cuisine)
        ? currentCuisines.filter(c => c !== cuisine)
        : [...currentCuisines, cuisine];
      const next = { ...prev, preferredCuisines: nextCuisines };
      localStorage.setItem("madeater_content_preferences", JSON.stringify(next));
      return next;
    });
  };

  // Instagram-style organized sections
  const sections: SettingSection[] = [
    {
      title: "How you use Madeater",
      items: [
        { 
          label: "Saved", 
          icon: <Bookmark size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            onClose();
            navigate(`/app/profile/${username}?tab=eatlist`);
          } 
        },
        { 
          label: "Archive", 
          icon: <History size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            onClose();
            navigate(`/app/profile/${username}?tab=diary`);
          } 
        },
        { 
          label: "Your activity", 
          icon: <Activity size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            onClose();
            navigate(`/app/profile/${username}?tab=profile`);
          } 
        },
        { 
          label: "Taste DNA & Quests", 
          icon: <Dna size={20} className="text-orange-400" />, 
          action: () => {
            triggerHaptic();
            onClose();
            navigate(`/app/profile/${username}?tab=taste`);
          } 
        },
        { 
          label: "Notifications", 
          value: notifConfig.pauseAll ? "Paused" : "Active",
          icon: notifConfig.pauseAll ? <BellOff size={20} className="text-zinc-400" /> : <Bell size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("notifications");
          } 
        },
        { 
          label: "Time management", 
          icon: <Clock size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Dining log reminders and active screen limits configured.");
          } 
        }
      ]
    },
    {
      title: "Who can see your content",
      items: [
        { 
          label: "Account privacy", 
          value: isPrivate ? "Private" : "Public",
          icon: <Lock size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("account_privacy");
          } 
        },
        { 
          label: "Close Friends", 
          value: closeFriends.length.toString(),
          icon: <Star size={20} className="text-amber-400" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("close_friends");
          } 
        },
        { 
          label: "Crossposting", 
          icon: <Layers size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Auto-sharing to external Instagram & Twitter accounts.");
          } 
        },
        { 
          label: "Blocked", 
          value: "0",
          icon: <Ban size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("0 blocked critics.");
          } 
        },
        { 
          label: "Story, live and location", 
          icon: <Radio size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Food stories & live location broadcasting.");
          } 
        },
        { 
          label: "Activity in Friends feed", 
          icon: <Users size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Friends feed activity sharing is enabled.");
          } 
        }
      ]
    },
    {
      title: "How others can interact with you",
      items: [
        { 
          label: "Messages and story replies", 
          icon: <MessageCircle size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Direct foodie conversations & inquiries.");
          } 
        },
        { 
          label: "Tags and mentions", 
          icon: <AtSign size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Allowing tags and mentions from everyone.");
          } 
        },
        { 
          label: "Comments", 
          icon: <MessageSquare size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Comments enabled on all food reviews & cravings.");
          } 
        },
        { 
          label: "Sharing", 
          icon: <Share2 size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Public resharing of dishes & food lists permitted.");
          } 
        },
        { 
          label: "Restricted", 
          value: "0",
          icon: <UserX size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("0 restricted accounts.");
          } 
        },
        { 
          label: "Limit interactions", 
          value: "Off",
          icon: <SlidersHorizontal size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Interaction limits are turned Off.");
          } 
        },
        { 
          label: "Hidden Words", 
          icon: <Type size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Offensive food comment filter active.");
          } 
        }
      ]
    },
    {
      title: "What you see",
      items: [
        { 
          label: "Favorites", 
          value: "0",
          icon: <Star size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Favorites list currently empty.");
          } 
        },
        { 
          label: "Muted accounts", 
          value: "0",
          icon: <VolumeX size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("0 muted accounts.");
          } 
        },
        { 
          label: "Content preferences", 
          value: `${contentPrefs.spiceTolerance} · ${contentPrefs.dietary?.length || 0} Rules`,
          icon: <Sliders size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("content_preferences");
          } 
        },
        { 
          label: "Like and share counts", 
          value: hideLikeCounts ? "Hidden" : "Visible",
          icon: <Heart size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("like_counts");
          } 
        }
      ]
    },
    {
      title: "Your app and media",
      items: [
        { 
          label: "Device permissions", 
          icon: <Smartphone size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Camera, Location GPS, and Storage permissions active.");
          } 
        },
        { 
          label: "Archiving and downloading", 
          icon: <Download size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("High-res photos & menus auto-cached locally.");
          } 
        },
        { 
          label: "Accessibility", 
          icon: <Accessibility size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Screen reader labels, haptics, and high-contrast support.");
          } 
        },
        { 
          label: "Language and sound", 
          value: "English (US)",
          icon: <Volume2 size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Default language: English (US)");
          } 
        },
        { 
          label: "Data usage and media quality", 
          value: "Full HD",
          icon: <BarChart2 size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Ultra-high fidelity food video streaming enabled.");
          } 
        },
        { 
          label: "Appearance & Theme", 
          value: theme === 'dark' ? "Dark Mode" : theme === 'light' ? "Light Mode" : "System",
          icon: theme === 'dark' ? <Moon size={20} className="text-amber-400" /> : <Sun size={20} className="text-orange-500" />, 
          action: () => {
            triggerHaptic();
            const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
            setTheme(nextTheme);
            toast.success(`Theme updated to ${nextTheme.toUpperCase()}`);
          } 
        }
      ]
    },
    {
      title: "Family Center",
      items: [
        { 
          label: "Supervision for Teen Accounts", 
          icon: <Shield size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Family Center and dining supervision tools.");
          } 
        }
      ]
    },
    {
      title: "Subscriptions",
      items: [
        { 
          label: "Madeater Plus", 
          value: "Not subscribed",
          icon: <Sparkles size={20} className="text-amber-400" />, 
          action: () => {
            triggerHaptic();
            toast.info("Madeater Plus: Unlimited AI dining queries & verified critic badge.");
          } 
        }
      ]
    },
    {
      title: "More info and support",
      items: [
        { 
          label: "Help & Support", 
          icon: <HelpCircle size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            window.open("mailto:support@madeater.in", "_blank");
          } 
        },
        { 
          label: "Privacy Policy", 
          icon: <ShieldCheck size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            window.open("/privacy", "_blank");
          } 
        },
        { 
          label: "Terms of Service", 
          icon: <FileText size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            window.open("/privacy", "_blank");
          } 
        }
      ]
    },
    {
      title: "Login",
      items: [
        { 
          label: "Add or Switch Account", 
          icon: <UserPlus size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            onClose();
            openAuthModal();
          } 
        },
        { 
          label: `Log out @${username}`, 
          icon: <LogOut size={20} className="text-rose-500" />, 
          action: () => {
            triggerHaptic();
            logout();
            onClose();
          },
          isDestructive: true 
        },
        { 
          label: "Delete Account & Purge Data", 
          icon: <Trash2 size={20} className="text-rose-500/80" />, 
          action: () => {
            triggerHaptic();
            onClose();
            navigate("/delete-account");
          },
          isDestructive: true 
        }
      ]
    }
  ];

  // Search filtering
  const filteredSections = searchQuery.trim()
    ? sections.map(sec => ({
        ...sec,
        items: sec.items.filter(item => 
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sec.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(sec => sec.items.length > 0)
    : sections;

  // Filter critics in Close Friends sub-screen
  const filteredCritics = CRITICS_LIST.filter(c => 
    c.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    c.username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden pointer-events-auto bg-black select-none">
      {/* Container - full screen on mobile, elegant max-w-xl on desktop */}
      <div className="relative w-full h-full md:max-w-xl md:h-[92vh] md:rounded-3xl bg-[#09090b] text-white border-0 md:border md:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* ============================================================ */}
        {/* TOP HEADER BAR */}
        {/* ============================================================ */}
        <div className="sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-xl px-4 py-3.5 border-b border-white/[0.08] flex items-center gap-4">
          <button 
            type="button"
            onClick={() => {
              triggerHaptic();
              if (activeSubView) {
                setActiveSubView(null);
              } else {
                onClose();
              }
            }} 
            className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft size={22} className="stroke-[2.2]" />
          </button>
          
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex-1 truncate">
            {activeSubView === "account_privacy" && "Account privacy"}
            {activeSubView === "close_friends" && "Close Friends"}
            {activeSubView === "notifications" && "Notifications"}
            {activeSubView === "like_counts" && "Like and share counts"}
            {activeSubView === "content_preferences" && "Content preferences"}
            {!activeSubView && "Settings and activity"}
          </h1>
        </div>

        {/* ============================================================ */}
        {/* 1. SUB-VIEW: ACCOUNT PRIVACY */}
        {/* ============================================================ */}
        {activeSubView === "account_privacy" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
            <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-between">
              <div className="pr-4 space-y-1">
                <span className="text-sm font-bold text-white block">Private account</span>
                <span className="text-xs text-zinc-400 block">
                  {isPrivate ? "Only approved followers can see your reviews & cravings." : "Anyone on or off Madeater can see your reviews."}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTogglePrivacy}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                  isPrivate ? "bg-orange-500" : "bg-zinc-700"
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  isPrivate ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="space-y-4 px-1 text-xs text-zinc-400 leading-relaxed">
              <p>
                <strong className="text-white">When your account is public:</strong> Your profile, ratings, dish reviews, and dining trails can be seen by anyone on Madeater or shared via web link. People can follow you instantly.
              </p>
              <p>
                <strong className="text-white">When your account is private:</strong> Only food critics you approve can follow you and view your dining logs, cravings, and food diary. Your existing followers won't be affected.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. SUB-VIEW: CLOSE FRIENDS (CRITIC CIRCLE) */}
        {/* ============================================================ */}
        {activeSubView === "close_friends" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col space-y-4 scrollbar-hide">
            <p className="text-xs text-zinc-400 px-1 leading-relaxed">
              We don't send notifications when you edit your Close Friends list. Share secret foodie spots and private reviews only with this circle.
            </p>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Search food critics"
                className="w-full bg-[#18181b] border border-white/[0.08] rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>

            {/* Counter and Clear */}
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-zinc-400">
                <strong className="text-orange-400 font-bold">{closeFriends.length}</strong> critics selected
              </span>
              {closeFriends.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setCloseFriends([]);
                    localStorage.setItem("madeater_close_friends", JSON.stringify([]));
                    toast.info("Cleared Close Friends list");
                  }}
                  className="text-zinc-400 hover:text-white cursor-pointer font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Critics List */}
            <div className="space-y-1 flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {filteredCritics.map(critic => {
                const isSelected = closeFriends.includes(critic.id);
                return (
                  <div
                    key={critic.id}
                    onClick={() => handleToggleCloseFriend(critic.id)}
                    className="w-full py-2.5 px-2 flex items-center justify-between hover:bg-white/[0.04] rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={critic.photo}
                        alt={critic.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{critic.name}</p>
                        <p className="text-xs text-zinc-400">@{critic.username}</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      isSelected 
                        ? "bg-orange-500 border-orange-500 text-white" 
                        : "border-zinc-600 bg-transparent"
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Done button */}
            <div className="pt-2 sticky bottom-0 bg-[#09090b]">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  toast.success(`Close Friends list saved (${closeFriends.length} critics)`);
                  setActiveSubView(null);
                }}
                className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. SUB-VIEW: NOTIFICATIONS */}
        {/* ============================================================ */}
        {activeSubView === "notifications" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
            {/* Master Pause */}
            <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-between">
              <div className="pr-4">
                <span className="text-sm font-bold text-white block">Pause all</span>
                <span className="text-xs text-zinc-400 block">Temporarily silence all push alerts</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotifKey("pauseAll")}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                  notifConfig.pauseAll ? "bg-orange-500" : "bg-zinc-700"
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  notifConfig.pauseAll ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Granular switches */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-zinc-400 px-1 mb-2">Dishes, Reviews & Comments</h3>
              
              <div className="p-3 rounded-2xl bg-[#18181b]/70 border border-white/[0.06] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white block">Likes on your reviews</span>
                    <span className="text-[11px] text-zinc-400">When someone likes your ratings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifConfig.likes}
                    onChange={() => handleToggleNotifKey("likes")}
                    className="w-5 h-5 accent-orange-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
                  <div>
                    <span className="text-sm font-medium text-white block">Comments and replies</span>
                    <span className="text-[11px] text-zinc-400">When someone comments on your dish</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifConfig.comments}
                    onChange={() => handleToggleNotifKey("comments")}
                    className="w-5 h-5 accent-orange-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
                  <div>
                    <span className="text-sm font-medium text-white block">New followers</span>
                    <span className="text-[11px] text-zinc-400">When a food critic follows you</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifConfig.newFollowers}
                    onChange={() => handleToggleNotifKey("newFollowers")}
                    className="w-5 h-5 accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-bold text-zinc-400 px-1 mb-2">Food Radar & Reminders</h3>
              
              <div className="p-3 rounded-2xl bg-[#18181b]/70 border border-white/[0.06] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white block">Trending nearby dining drops</span>
                    <span className="text-[11px] text-zinc-400">Hot spots trending near your city</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifConfig.nearbyDrops}
                    onChange={() => handleToggleNotifKey("nearbyDrops")}
                    className="w-5 h-5 accent-orange-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
                  <div>
                    <span className="text-sm font-medium text-white block">Daily meal journal reminders</span>
                    <span className="text-[11px] text-zinc-400">Evening reminder to log what you ate</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifConfig.mealReminders}
                    onChange={() => handleToggleNotifKey("mealReminders")}
                    className="w-5 h-5 accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. SUB-VIEW: LIKE AND SHARE COUNTS */}
        {/* ============================================================ */}
        {activeSubView === "like_counts" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
            <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-between">
              <div className="pr-4 space-y-1">
                <span className="text-sm font-bold text-white block">Hide like and view counts</span>
                <span className="text-xs text-zinc-400 block">
                  {hideLikeCounts ? "Numeric counts are hidden across all feeds." : "Numeric counts are visible."}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleHideLikeCounts}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                  hideLikeCounts ? "bg-orange-500" : "bg-zinc-700"
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  hideLikeCounts ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="space-y-4 px-1 text-xs text-zinc-400 leading-relaxed">
              <p>
                On Madeater, you won't see the total number of likes and views on reviews and cravings from other accounts.
              </p>
              <p>
                You can also hide like counts on your own posts when you create them by going to Advanced settings in the meal logger.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. SUB-VIEW: CONTENT PREFERENCES */}
        {/* ============================================================ */}
        {activeSubView === "content_preferences" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
            {/* Dietary lifestyle */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 px-1">Dietary Lifestyle Rules</h3>
              <div className="flex flex-wrap gap-2">
                {["Vegetarian", "Non-Veg", "Halal", "Vegan", "Jain", "Gluten-Free"].map(rule => {
                  const isChecked = contentPrefs.dietary?.includes(rule);
                  return (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => handleToggleDietary(rule)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked 
                          ? "bg-orange-500 text-white shadow-sm" 
                          : "bg-[#18181b] text-zinc-400 border border-white/[0.08] hover:text-white"
                      }`}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                      <span>{rule}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spice tolerance */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 px-1">Spice Tolerance</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { level: "Mild", icon: "🌿", desc: "Gentle aromatic spices, zero chili burn" },
                  { level: "Medium", icon: "🌶️", desc: "Balanced traditional Indian warmth" },
                  { level: "Spicy", icon: "🔥", desc: "Authentic regional chili punch" },
                  { level: "Fiery", icon: "💥", desc: "Ghost pepper & extreme spice only" }
                ].map(item => {
                  const isSelected = contentPrefs.spiceTolerance === item.level;
                  return (
                    <div
                      key={item.level}
                      onClick={() => handleSelectSpice(item.level)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-gradient-to-b from-orange-500/20 to-orange-500/5 border-orange-500 text-white" 
                          : "bg-[#18181b] border-white/[0.08] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{item.icon}</span> {item.level}
                        </span>
                        {isSelected && <CheckCircle2 size={16} className="text-orange-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preferred Cuisines */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 px-1">Preferred Regional Cuisines</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Biryani & Hyderabadi", 
                  "South Indian", 
                  "North Indian", 
                  "Pan-Asian", 
                  "Italian & Pizza", 
                  "Middle Eastern", 
                  "Street Food & Chaat", 
                  "Desserts & Cafes"
                ].map(cuisine => {
                  const isChecked = contentPrefs.preferredCuisines?.includes(cuisine);
                  return (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => handleToggleCuisine(cuisine)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked 
                          ? "bg-white text-black font-bold shadow-sm" 
                          : "bg-[#18181b] text-zinc-400 border border-white/[0.08] hover:text-white"
                      }`}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                      <span>{cuisine}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN SETTINGS LIST */}
        {/* ============================================================ */}
        {!activeSubView && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 scrollbar-hide">
            
            {/* Instagram-style Pill Search Bar */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-[#18181b] border border-white/[0.08] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* 1. Accounts Center Hero Card (Instagram 1:1) */}
            {!searchQuery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-zinc-400">Your account</span>
                  <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-orange-400">
                    <span>MADEATER</span>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    triggerHaptic();
                    onEditProfile ? onEditProfile() : onClose();
                  }}
                  className="p-4 rounded-2xl bg-[#18181b]/90 hover:bg-[#18181b] border border-white/[0.08] transition-all cursor-pointer group active:scale-[0.99] space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {userPhoto ? (
                        <img 
                          src={userPhoto} 
                          alt={username} 
                          className="w-11 h-11 rounded-full object-cover border border-white/15" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                          <User size={22} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          Accounts Center
                        </h4>
                        <p className="text-xs text-zinc-400 truncate">
                          @{username}
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-zinc-500 group-hover:text-white transition-colors shrink-0 mt-2" />
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                    Password, security, personal dining details, taste profile, and connected experiences
                  </p>
                </div>
              </div>
            )}

            {/* Categorized Settings List (Instagram 1:1) */}
            {filteredSections.map((section, sidx) => (
              <div key={sidx} className="space-y-1">
                <h3 className="px-1 text-[11px] font-bold text-zinc-400 mb-1">
                  {section.title}
                </h3>

                <div className="divide-y divide-white/[0.04]">
                  {section.items.map((item, iidx) => (
                    <button
                      key={iidx}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        item.action();
                      }}
                      className="w-full flex items-center justify-between py-3.5 px-1 hover:bg-white/[0.03] rounded-xl transition-all group active:bg-white/[0.06] cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-6 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <span className={`text-sm font-normal tracking-tight truncate ${
                          item.isDestructive 
                            ? 'text-rose-500 font-medium' 
                            : 'text-zinc-100 group-hover:text-white'
                        }`}>
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.value && (
                          <span className="text-xs text-zinc-400 font-normal">
                            {item.value}
                          </span>
                        )}
                        {!item.isDestructive && (
                          <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Footer Info */}
            <div className="pt-4 pb-8 text-center space-y-1 select-none border-t border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">Madeater v1.0.9</p>
              <p className="text-[10px] text-zinc-600">The Social Network for Food</p>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
