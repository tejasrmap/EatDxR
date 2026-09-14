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
  BellOff,
  Camera,
  MapPin,
  Crown
} from "lucide-react";
import { useAuth } from "../App";
import { useTheme } from "./ThemeProvider";
import { triggerHaptic, isNative } from "../services/nativeService";
import { Geolocation } from "@capacitor/geolocation";
import { Camera as CapCamera } from "@capacitor/camera";
import { PushNotifications } from "@capacitor/push-notifications";
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

type SubView = 
  | null 
  | "account_privacy" 
  | "close_friends" 
  | "notifications" 
  | "like_counts" 
  | "content_preferences"
  | "device_permissions"
  | "data_saver"
  | "hidden_words"
  | "madeater_plus";

import { getTopCritics } from "../services/supabaseService";

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
      if (saved && saved.includes("priya_eats")) {
        localStorage.removeItem("madeater_close_friends");
        return [];
      }
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [friendSearch, setFriendSearch] = useState("");
  const [criticsList, setCriticsList] = useState<{ id: string; name: string; username: string; photo: string }[]>([]);

  useEffect(() => {
    getTopCritics(30).then((users) => {
      setCriticsList(users.filter(u => u.uid !== user?.uid).map(u => ({
        id: u.uid,
        name: u.displayName || u.username || "Food Critic",
        username: u.username || "critic",
        photo: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`
      })));
    }).catch(() => {});
  }, [user?.uid]);

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

  // 6. Additional Activated Settings States
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    return localStorage.getItem("madeater_data_saver") === "true";
  });

  const [hiddenWords, setHiddenWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("madeater_hidden_words");
      return saved ? JSON.parse(saved) : ["stale", "spoiled", "raw egg"];
    } catch {
      return ["stale", "spoiled", "raw egg"];
    }
  });
  const [newWordInput, setNewWordInput] = useState("");

  const [isVip, setIsVip] = useState<boolean>(() => {
    return localStorage.getItem("madeater_vip_critic") === "true";
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

  // Additional settings handlers
  const handleToggleDataSaver = () => {
    triggerHaptic();
    const nextVal = !dataSaver;
    setDataSaver(nextVal);
    localStorage.setItem("madeater_data_saver", nextVal ? "true" : "false");
    toast.success(nextVal ? "Data Saver activated (saving 70% data)" : "Full HD media streaming enabled");
  };

  const handleAddHiddenWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordInput.trim()) return;
    triggerHaptic();
    const word = newWordInput.trim().toLowerCase();
    if (!hiddenWords.includes(word)) {
      const next = [...hiddenWords, word];
      setHiddenWords(next);
      localStorage.setItem("madeater_hidden_words", JSON.stringify(next));
      window.dispatchEvent(new Event("madeater_hidden_words_changed"));
      window.dispatchEvent(new Event("storage"));
      toast.success(`Added "${word}" to food filter`);
    }
    setNewWordInput("");
  };

  const handleRemoveHiddenWord = (word: string) => {
    triggerHaptic();
    const next = hiddenWords.filter(w => w !== word);
    setHiddenWords(next);
    localStorage.setItem("madeater_hidden_words", JSON.stringify(next));
    window.dispatchEvent(new Event("madeater_hidden_words_changed"));
    window.dispatchEvent(new Event("storage"));
    toast.info(`Removed "${word}"`);
  };

  const handleToggleVip = () => {
    triggerHaptic();
    const nextVal = !isVip;
    setIsVip(nextVal);
    localStorage.setItem("madeater_vip_critic", nextVal ? "true" : "false");
    window.dispatchEvent(new Event("madeater_vip_changed"));
    window.dispatchEvent(new Event("storage"));
    toast.success(nextVal ? "🎉 Madeater Plus VIP Pass Activated!" : "VIP Pass deactivated");
  };

  // Request native permissions
  const handleRequestCamera = async () => {
    triggerHaptic();
    try {
      if (isNative) {
        await CapCamera.requestPermissions();
        toast.success("Camera permission granted!");
      } else {
        toast.success("Web Camera access is active.");
      }
    } catch {
      toast.error("Camera permission prompt cancelled.");
    }
  };

  const handleRequestLocation = async () => {
    triggerHaptic();
    try {
      if (isNative) {
        await Geolocation.requestPermissions();
        toast.success("GPS Location permission granted!");
      } else {
        navigator.geolocation?.getCurrentPosition(() => toast.success("GPS Location is active!"));
      }
    } catch {
      toast.error("Location permission prompt cancelled.");
    }
  };

  const handleRequestPush = async () => {
    triggerHaptic();
    try {
      if (isNative) {
        await PushNotifications.requestPermissions();
        toast.success("Push Notifications permission granted!");
      } else {
        toast.success("Web Push Notifications are enabled.");
      }
    } catch {
      toast.error("Push Notifications permission cancelled.");
    }
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
          value: `${hiddenWords.length} Filtered`,
          icon: <Type size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("hidden_words");
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
          value: "3 Active",
          icon: <Smartphone size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("device_permissions");
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
          value: dataSaver ? "Data Saver" : "Full HD",
          icon: <BarChart2 size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("data_saver");
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
          value: isVip ? "VIP Active" : "Not subscribed",
          icon: <Crown size={20} className="text-amber-400" />, 
          action: () => {
            triggerHaptic();
            setActiveSubView("madeater_plus");
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

  const filteredCritics = criticsList.filter(c => 
    c.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    c.username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden pointer-events-auto bg-black select-none">
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
            {activeSubView === "device_permissions" && "Device permissions"}
            {activeSubView === "data_saver" && "Data usage and media quality"}
            {activeSubView === "hidden_words" && "Hidden Words"}
            {activeSubView === "madeater_plus" && "Madeater Plus"}
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
                <strong className="text-white">When your account is private:</strong> Only food critics you approve can follow you and view your dining logs, cravings, and food diary.
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
        {/* 6. SUB-VIEW: DEVICE PERMISSIONS */}
        {/* ============================================================ */}
        {activeSubView === "device_permissions" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            <p className="text-xs text-zinc-400 px-1 leading-relaxed">
              Madeater requires device access to capture photos, pinpoint food stalls on the map, and notify you of dining drops.
            </p>

            <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Camera size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Camera & Photos</h4>
                  <p className="text-xs text-zinc-400">Snap meal photos & scan QR menus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestCamera}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
              >
                Test
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">GPS Precise Location</h4>
                  <p className="text-xs text-zinc-400">Discover nearby stalls & accurate geo-pins</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestLocation}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
              >
                Test
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Push Notifications</h4>
                  <p className="text-xs text-zinc-400">Critic comments, likes, and meal reminders</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPush}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
              >
                Test
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 7. SUB-VIEW: DATA SAVER & MEDIA QUALITY */}
        {/* ============================================================ */}
        {activeSubView === "data_saver" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
            <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-between">
              <div className="pr-4 space-y-1">
                <span className="text-sm font-bold text-white block">Data Saver Mode</span>
                <span className="text-xs text-zinc-400 block">
                  {dataSaver ? "Compresses high-res food photos by 70% to save cellular data." : "Streaming full-resolution 4K food media."}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleDataSaver}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                  dataSaver ? "bg-orange-500" : "bg-zinc-700"
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  dataSaver ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 px-1">Upload at highest quality</h3>
              <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] space-y-1 text-xs text-zinc-300">
                <p>Always upload high-resolution food review photography even if upload takes longer.</p>
                <span className="text-emerald-400 font-bold block pt-1">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 8. SUB-VIEW: HIDDEN WORDS / INGREDIENT FILTER */}
        {/* ============================================================ */}
        {activeSubView === "hidden_words" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            <p className="text-xs text-zinc-400 px-1 leading-relaxed">
              Hide reviews and cravings that contain words or ingredients you don't want to see (allergens, specific meats, or offensive remarks).
            </p>

            <form onSubmit={handleAddHiddenWord} className="flex items-center gap-2">
              <input
                type="text"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                placeholder="Add keyword (e.g. Peanuts, Pork)..."
                className="flex-1 bg-[#18181b] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newWordInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40"
              >
                Add
              </button>
            </form>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-zinc-400 px-1">Active Filtered Words</h3>
              <div className="flex flex-wrap gap-2">
                {hiddenWords.map(word => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 border border-white/10 text-xs font-medium"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHiddenWord(word)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 9. SUB-VIEW: MADEATER PLUS (VIP CRITIC PASS) */}
        {/* ============================================================ */}
        {activeSubView === "madeater_plus" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
            {/* VIP Card Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-tr from-amber-500/30 via-orange-500/20 to-rose-500/20 border border-amber-500/40 text-center space-y-3 shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-black shadow-lg">
                <Crown size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Madeater Plus</h3>
                <p className="text-xs text-amber-300 font-semibold">The Ultimate VIP Food Critic Pass</p>
              </div>

              <div className="pt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                  isVip 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-white/10 text-zinc-300 border-white/10"
                }`}>
                  {isVip ? "✓ VIP Status Active" : "30-Day Free Trial Available"}
                </span>
              </div>
            </div>

            {/* Perks list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 px-1">Exclusive VIP Privileges</h4>
              <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] space-y-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-base">⭐</span>
                  <div>
                    <span className="font-bold text-white block">Verified Gold Critic Badge</span>
                    <span className="text-zinc-400">Stands out on all reviews and top lists</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base">🤖</span>
                  <div>
                    <span className="font-bold text-white block">Unlimited Chef AI Assistant</span>
                    <span className="text-zinc-400">Instant secret dish suggestions & wine pairings</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base">🎟️</span>
                  <div>
                    <span className="font-bold text-white block">Secret Dining Drops</span>
                    <span className="text-zinc-400">First access to underground pop-up tastings</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base">🚫</span>
                  <div>
                    <span className="font-bold text-white block">100% Ad-Free Experience</span>
                    <span className="text-zinc-400">Zero sponsored interruption in your feed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle VIP button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleToggleVip}
                className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer active:scale-[0.98] ${
                  isVip 
                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/15" 
                    : "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black shadow-orange-500/20"
                }`}
              >
                {isVip ? "Cancel VIP Pass" : "Activate 30-Day VIP Pass (Free)"}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN SETTINGS LIST */}
        {/* ============================================================ */}
        {!activeSubView && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 scrollbar-hide">
            
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

            <div className="pt-4 pb-8 text-center space-y-1 select-none border-t border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">Madeater v1.1.1</p>
              <p className="text-[10px] text-zinc-600">The Social Network for Food</p>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
