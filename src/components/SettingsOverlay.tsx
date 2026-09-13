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
  Globe,
  Sparkles,
  Shield,
  Dna
} from "lucide-react";
import { useAuth } from "../App";
import { useTheme } from "./ThemeProvider";
import { triggerHaptic } from "../services/nativeService";
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

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ 
  isOpen, 
  onClose,
  onEditProfile
}) => {
  const { user, dishdUser, logout, openAuthModal } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const username = dishdUser?.username || user?.displayName?.toLowerCase().replace(/\s+/g, "_") || "critic";
  const userPhoto = dishdUser?.photoURL || user?.photoURL;

  // Instagram-style organized sections matching the user's screenshots
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
          icon: <Bell size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Push & Critic visit notifications are active.");
          } 
        },
        { 
          label: "Time management", 
          icon: <Clock size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Dining log reminders & session limits configured.");
          } 
        }
      ]
    },
    {
      title: "Who can see your content",
      items: [
        { 
          label: "Account privacy", 
          value: "Public",
          icon: <Lock size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Critic profile is set to Public for global discovery.");
          } 
        },
        { 
          label: "Close Friends", 
          value: "26",
          icon: <Star size={20} className="text-amber-400" />, 
          action: () => {
            triggerHaptic();
            toast.info("Critic Circle (Close Friends) active with 26 critics.");
          } 
        },
        { 
          label: "Crossposting", 
          icon: <Layers size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Automatic sharing to Instagram & Twitter/X configured.");
          } 
        },
        { 
          label: "Blocked", 
          value: "0",
          icon: <Ban size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("No critics or accounts are blocked.");
          } 
        },
        { 
          label: "Story, live and location", 
          icon: <Radio size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Story and live food broadcasting settings.");
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
            toast.info("Direct foodie conversations & inquiries active.");
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
            toast.info("Favorite foodie posts will show higher in your feed.");
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
          icon: <Sliders size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Dietary, spice level & regional cuisine preferences.");
          } 
        },
        { 
          label: "Like and share counts", 
          icon: <Heart size={20} className="text-zinc-200" />, 
          action: () => {
            triggerHaptic();
            toast.info("Reaction counts are visible.");
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden pointer-events-auto bg-black select-none">
      {/* Container - full screen on mobile, elegant max-w-xl on desktop */}
      <div className="relative w-full h-full md:max-w-xl md:h-[92vh] md:rounded-3xl bg-[#09090b] text-white border-0 md:border md:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Top Header: Instagram Style Back Arrow + Title */}
        <div className="sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-xl px-4 py-3.5 border-b border-white/[0.08] flex items-center gap-4">
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
          
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex-1 truncate">
            Settings and activity
          </h1>
        </div>

        {/* Scrollable Content */}
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
      </div>
    </div>,
    document.body
  );
};
