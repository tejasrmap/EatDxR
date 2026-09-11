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
  Info,
  Sun,
  Moon,
  Monitor,
  Trash2
} from "lucide-react";
import { useAuth } from "../App";
import { useTheme } from "./ThemeProvider";
import { triggerHaptic } from "../services/nativeService";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ 
  isOpen, 
  onClose,
  onEditProfile
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const sections = [
    {
      title: "Appearance & Theme",
      items: [
        { 
          label: `Dark Mode ${theme === 'dark' ? '✓ (Active)' : ''}`, 
          icon: <Moon size={20} className={theme === 'dark' ? 'text-amber-400' : 'text-muted-foreground'} />, 
          action: () => { triggerHaptic(); setTheme('dark'); } 
        },
        { 
          label: `Light Mode ${theme === 'light' ? '✓ (Active)' : ''}`, 
          icon: <Sun size={20} className={theme === 'light' ? 'text-orange-500' : 'text-muted-foreground'} />, 
          action: () => { triggerHaptic(); setTheme('light'); } 
        },
        { 
          label: `System Default ${theme === 'system' ? '✓ (Active)' : ''}`, 
          icon: <Monitor size={20} className={theme === 'system' ? 'text-blue-400' : 'text-muted-foreground'} />, 
          action: () => { triggerHaptic(); setTheme('system'); } 
        },
      ]
    },
    {
      title: "How you use Madeater",
      items: [
        { 
          label: "Edit Profile", 
          icon: <UserCircle size={20} className="text-muted-foreground" />, 
          action: () => { onEditProfile?.(); onClose(); } 
        },
        { 
          label: "Notifications", 
          icon: <Bell size={20} className="text-muted-foreground" />, 
          action: () => {} 
        }
      ]
    },
    {
      title: "Privacy and Safety",
      items: [
        { 
          label: "Privacy Policy", 
          icon: <Shield size={20} className="text-muted-foreground" />, 
          action: () => { window.open("/privacy", "_blank"); } 
        },
        { 
          label: "Reset Password via Email", 
          icon: <Lock size={20} className="text-orange-400" />, 
          action: async () => { 
            triggerHaptic();
            if (!user?.email) {
              toast.error("Please sign in to reset your password.");
              return;
            }
            try {
              await sendPasswordResetEmail(auth, user.email);
              toast.success(`Password reset email sent to ${user.email}!`);
            } catch (err: any) {
              toast.error(err?.message || "Failed to send password reset email.");
            }
          } 
        },
        { 
          label: "Delete Account & Data", 
          icon: <Trash2 size={20} className="text-rose-500" />, 
          action: () => { 
            triggerHaptic();
            window.open("/delete-account", "_blank"); 
          } 
        }
      ]
    },
    {
      title: "Interactions",
      items: [
        { 
          label: "Comments", 
          icon: <MessageSquare size={20} className="text-muted-foreground" />, 
          action: () => {} 
        },
        { 
          label: "Tags and Mentions", 
          icon: <AtSign size={20} className="text-muted-foreground" />, 
          action: () => {} 
        },
        { 
          label: "Likes", 
          icon: <Heart size={20} className="text-muted-foreground" />, 
          action: () => {} 
        }
      ]
    },
    {
      title: "More Info",
      items: [
        { 
          label: "Help", 
          icon: <HelpCircle size={20} className="text-muted-foreground" />, 
          action: () => {} 
        },
        { 
          label: "About", 
          icon: <Info size={20} className="text-muted-foreground" />, 
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
        className="absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className="relative w-full h-full md:h-[80vh] md:max-w-xl md:rounded-3xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/50 backdrop-blur-md px-6 py-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                <X size={24} className="text-muted-foreground" />
             </button>
             <h2 className="text-xl font-black tracking-tighter text-foreground">Settings and Privacy</h2>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-8 scrollbar-hide">
          {sections.map((section, sidx) => (
            <div key={sidx} className="space-y-2">
               <h3 className="px-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-4">
                  {section.title}
               </h3>
               <div className="space-y-1">
                  {section.items.map((item, iidx) => (
                    <button
                      key={iidx}
                      onClick={item.action}
                      className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-muted transition-all group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/30 border border-border group-hover:border-muted-foreground/50 transition-colors">
                            {item.icon}
                         </div>
                         <span className={`text-sm font-bold tracking-tight ${item.isDestructive ? 'text-rose-500/80' : 'text-foreground/80'} group-hover:text-foreground transition-colors`}>
                            {item.label}
                         </span>
                      </div>
                      {!item.isDestructive && (
                         <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                      )}
                    </button>
                  ))}
               </div>
            </div>
          ))}

          {/* Version Info */}
          <div className="pt-8 pb-12 text-center space-y-1">
             <p className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground">Madeater v1.0.4</p>
             <p className="text-[9px] font-medium italic serif text-muted-foreground/30">Designed for the Culinary Elite</p>
          </div>
        </div>
      </div>
    </div>
  );
};
