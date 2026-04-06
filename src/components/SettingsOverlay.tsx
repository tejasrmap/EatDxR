import React from "react";
import { 
  X, 
  User, 
  Shield, 
  Bell, 
  LogOut, 
  ChevronRight, 
  UserCircle,
  Lock,
  MessageSquare,
  AtSign,
  Heart,
  HelpCircle,
  Info
} from "lucide-react";
import { useAuth } from "../App";

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ 
  isOpen, 
  onClose,
  onEditProfile
}) => {
  const { logout } = useAuth();

  if (!isOpen) return null;

  const sections = [
    {
      title: "How you use EatR",
      items: [
        { 
          label: "Edit Profile", 
          icon: <UserCircle size={20} className="text-white/40" />, 
          action: () => { onEditProfile(); onClose(); } 
        },
        { 
          label: "Notifications", 
          icon: <Bell size={20} className="text-white/40" />, 
          action: () => {} 
        }
      ]
    },
    {
      title: "Privacy and Safety",
      items: [
        { 
          label: "Privacy", 
          icon: <Shield size={20} className="text-white/40" />, 
          action: () => {} 
        },
        { 
          label: "Password and Security", 
          icon: <Lock size={20} className="text-white/40" />, 
          action: () => {} 
        }
      ]
    },
    {
      title: "Interactions",
      items: [
        { 
          label: "Comments", 
          icon: <MessageSquare size={20} className="text-white/40" />, 
          action: () => {} 
        },
        { 
          label: "Tags and Mentions", 
          icon: <AtSign size={20} className="text-white/40" />, 
          action: () => {} 
        },
        { 
          label: "Likes", 
          icon: <Heart size={20} className="text-white/40" />, 
          action: () => {} 
        }
      ]
    },
    {
      title: "More Info",
      items: [
        { 
          label: "Help", 
          icon: <HelpCircle size={20} className="text-white/40" />, 
          action: () => {} 
        },
        { 
          label: "About", 
          icon: <Info size={20} className="text-white/40" />, 
          action: () => {} 
        }
      ]
    },
    {
      title: "Login",
      items: [
        { 
          label: "Log Out", 
          icon: <LogOut size={20} className="text-rose-500/60" />, 
          action: () => { logout(); onClose(); },
          isDestructive: true 
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className="relative w-full h-full md:h-[80vh] md:max-w-xl md:rounded-3xl bg-zinc-950/90 border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/50 backdrop-blur-md px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} className="text-white/60" />
             </button>
             <h2 className="text-xl font-black tracking-tighter text-white">Settings and Privacy</h2>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-8 scrollbar-hide">
          {sections.map((section, sidx) => (
            <div key={sidx} className="space-y-2">
               <h3 className="px-4 text-[10px] uppercase tracking-[0.2em] font-black text-white/20 mb-4">
                  {section.title}
               </h3>
               <div className="space-y-1">
                  {section.items.map((item, iidx) => (
                    <button
                      key={iidx}
                      onClick={item.action}
                      className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 group-hover:border-white/10 transition-colors">
                            {item.icon}
                         </div>
                         <span className={`text-sm font-bold tracking-tight ${item.isDestructive ? 'text-rose-500/80' : 'text-white/80'} group-hover:text-white transition-colors`}>
                            {item.label}
                         </span>
                      </div>
                      {!item.isDestructive && (
                         <ChevronRight size={16} className="text-white/10 group-hover:text-white/40 transition-colors" />
                      )}
                    </button>
                  ))}
               </div>
            </div>
          ))}

          {/* Version Info */}
          <div className="pt-8 pb-12 text-center space-y-1">
             <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/10">EatR v1.0.4</p>
             <p className="text-[9px] font-medium italic serif text-white/5">Designed for the Culinary Elite</p>
          </div>
        </div>
      </div>
    </div>
  );
};
