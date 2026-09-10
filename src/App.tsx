/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, createContext, useContext, ReactNode, ErrorInfo, Component } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AdminSeed } from "./components/AdminSeed";
import { Toaster, toast } from "sonner";
import { User as DishdUser } from "./types";
import { auth, db } from "./firebase";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { EditProfileModal } from "./components/EditProfileModal";
import { isNative } from "./services/nativeService";
import { getProfile, upsertProfile } from "./services/supabaseService";

// Website Components
import { WebsiteLayout } from "./components/website/WebsiteLayout";
import { WebsiteHome } from "./pages/WebsiteHome";

// Custom App Components
import { AppLayout } from "./components/app/AppLayout";
import { CustomAppHome } from "./pages/CustomAppHome";

// Shared Madeater Feature Views
import { CravingsFeed } from "./components/CravingsFeed";
import { DishesDirectory } from "./components/DishesDirectory";
import { DishPage } from "./components/DishPage";
import { FoodLists } from "./components/FoodLists";
import { ListDetail } from "./components/ListDetail";
import { FoodMap } from "./components/FoodMap";
import { YearInFood } from "./components/YearInFood";
import { Profile } from "./components/Profile";
import { Restaurant } from "./components/Restaurant";
import { Restaurants } from "./components/Restaurants";
import { Critics } from "./components/Critics";
import { Journal } from "./components/Journal";
import { ApecERPPrivacy } from "./pages/ApecERPPrivacy";

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold mb-4 serif italic text-white">Something went wrong.</h1>
          <p className="text-white/60 mb-8 max-w-md">
            {this.state.error?.message.startsWith('{') 
              ? "A database error occurred. Please check your permissions." 
              : this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { AuthModal } from "./components/AuthModal";

// --- Auth Context ---
interface AuthContextType {
  user: FirebaseUser | null;
  dishdUser: DishdUser | null;
  loading: boolean;
  login: (redirectUrl?: string) => void;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (redirectUrl?: string) => void;
  closeAuthModal: () => void;
  updateDishdUser: (updated: Partial<DishdUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dishdUser, setDishdUser] = useState<DishdUser | null>(() => {
    try {
      const cached = localStorage.getItem("madeater_dishd_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // 1. Primary: Check Firebase Firestore `users` collection
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreUser = userDocSnap.data() as DishdUser;
            setDishdUser(firestoreUser);
            localStorage.setItem("madeater_dishd_user", JSON.stringify(firestoreUser));
          } else {
            // 2. Secondary check: Supabase profiles
            const supabaseUser = await getProfile(currentUser.uid);
            if (supabaseUser) {
              setDishdUser(supabaseUser);
              localStorage.setItem("madeater_dishd_user", JSON.stringify(supabaseUser));
              // Sync back to Firebase Firestore
              await setDoc(userDocRef, supabaseUser, { merge: true });
            } else {
              // 3. New User: Create full profile in Firebase Firestore & sync to Supabase
              const defaultUsername = currentUser.displayName
                ? currentUser.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)
                : `critic_${currentUser.uid.slice(0, 6)}`;
              const newUser: DishdUser = {
                uid: currentUser.uid,
                displayName: currentUser.displayName || "Food Lover",
                email: currentUser.email || "",
                photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
                username: defaultUsername,
                bio: "Food critic on Madeater",
                tasteDNA: {
                  spice: 60,
                  indian: 75,
                  nonVeg: 50,
                  asian: 40,
                  desserts: 50,
                  coffee: 70,
                  personaTitle: "The Flavor Explorer"
                },
                stats: {
                  mealsLogged: 0,
                  reviewsWritten: 0,
                  followers: 0,
                  following: 0,
                  followingList: []
                },
                createdAt: new Date().toISOString()
              };
              // Save directly to Firebase Firestore
              await setDoc(userDocRef, newUser, { merge: true });
              // Sync to Supabase
              await upsertProfile(newUser);
              setDishdUser(newUser);
              localStorage.setItem("madeater_dishd_user", JSON.stringify(newUser));
            }
          }
        } catch (error) {
          console.error("Error fetching user profile from Firebase Firestore:", error);
        }
      } else {
        // Auth state signed out
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const logout = async () => {
    try {
      await signOut(auth);
      setDishdUser(null);
      setUser(null);
      localStorage.removeItem("madeater_dishd_user");
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateDishdUser = (updated: Partial<DishdUser>) => {
    setDishdUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem("madeater_dishd_user", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const login = (targetUrl?: string) => {
    if (targetUrl) setRedirectUrl(targetUrl);
    setIsAuthModalOpen(true);
  };

  const openAuthModal = (targetUrl?: string) => {
    if (targetUrl) setRedirectUrl(targetUrl);
    setIsAuthModalOpen(true);
  };

  const isOnboarding = !onboardingDismissed && !!user && !!dishdUser && (!dishdUser.username || dishdUser.username === "");

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        dishdUser, 
        loading, 
        login, 
        logout, 
        isAuthModalOpen, 
        openAuthModal, 
        closeAuthModal: () => { setIsAuthModalOpen(false); setRedirectUrl(null); },
        updateDishdUser
      }}
    >
      {children}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => { setIsAuthModalOpen(false); setRedirectUrl(null); }} 
        redirectUrl={redirectUrl}
        onRedirectDone={() => setRedirectUrl(null)}
      />
      {isOnboarding && (
        <EditProfileModal 
          isOpen={true} 
          onClose={() => setOnboardingDismissed(true)} 
          user={dishdUser} 
          isOnboarding={true} 
        />
      )}
    </AuthContext.Provider>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user?.email !== 'tejag.vijay@gmail.com') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function MyProfileRoute() {
  const { user, dishdUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/app" replace />;
  }
  
  const handle = dishdUser?.username || user.uid;
  return <Navigate to={`/app/profile/${handle}`} replace />;
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="eatdxr-theme">
        <Router>
          <AuthProvider>
            <Routes>
              {/* 1. PUBLIC WEBSITE ROUTES (Wrapped in WebsiteLayout on web, AppLayout on Native APK) */}
              <Route 
                path="/" 
                element={
                  isNative ? (
                    <Navigate to="/app" replace />
                  ) : (
                    <WebsiteLayout>
                      <WebsiteHome />
                    </WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/dishes" 
                element={
                  isNative ? (
                    <AppLayout><DishesDirectory /></AppLayout>
                  ) : (
                    <WebsiteLayout><DishesDirectory /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/explore" 
                element={
                  isNative ? (
                    <AppLayout><DishesDirectory /></AppLayout>
                  ) : (
                    <WebsiteLayout><DishesDirectory /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/dish/:dishId" 
                element={
                  isNative ? (
                    <AppLayout><DishPage /></AppLayout>
                  ) : (
                    <WebsiteLayout><DishPage /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/restaurants" 
                element={
                  isNative ? (
                    <AppLayout><Restaurants /></AppLayout>
                  ) : (
                    <WebsiteLayout><Restaurants /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/restaurant/:restaurantId" 
                element={
                  isNative ? (
                    <AppLayout><Restaurant /></AppLayout>
                  ) : (
                    <WebsiteLayout><Restaurant /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/map" 
                element={
                  isNative ? (
                    <AppLayout><FoodMap /></AppLayout>
                  ) : (
                    <WebsiteLayout><FoodMap /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/critics" 
                element={
                  isNative ? (
                    <AppLayout><Critics /></AppLayout>
                  ) : (
                    <WebsiteLayout><Critics /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/lists" 
                element={
                  isNative ? (
                    <AppLayout><FoodLists /></AppLayout>
                  ) : (
                    <WebsiteLayout><FoodLists /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/list/:listId" 
                element={
                  isNative ? (
                    <AppLayout><ListDetail /></AppLayout>
                  ) : (
                    <WebsiteLayout><ListDetail /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/journal" 
                element={
                  isNative ? (
                    <AppLayout><Journal /></AppLayout>
                  ) : (
                    <WebsiteLayout><Journal /></WebsiteLayout>
                  )
                } 
              />
              <Route 
                path="/wrapped" 
                element={
                  isNative ? (
                    <AppLayout><YearInFood /></AppLayout>
                  ) : (
                    <WebsiteLayout><YearInFood /></WebsiteLayout>
                  )
                } 
              />

              {/* 2. CUSTOM MOBILE APP ROUTES (Wrapped in AppLayout with AppHeader & Bottom Dock) */}
              <Route 
                path="/app" 
                element={
                  <AppLayout>
                    <CustomAppHome />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/cravings" 
                element={
                  <AppLayout>
                    <CravingsFeed />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/dishes" 
                element={
                  <AppLayout>
                    <DishesDirectory />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/explore" 
                element={
                  <AppLayout>
                    <DishesDirectory />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/dish/:dishId" 
                element={
                  <AppLayout>
                    <DishPage />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/restaurants" 
                element={
                  <AppLayout>
                    <Restaurants />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/restaurant/:restaurantId" 
                element={
                  <AppLayout>
                    <Restaurant />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/map" 
                element={
                  <AppLayout>
                    <FoodMap />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/critics" 
                element={
                  <AppLayout>
                    <Critics />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/lists" 
                element={
                  <AppLayout>
                    <FoodLists />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/list/:listId" 
                element={
                  <AppLayout>
                    <ListDetail />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/profile/:userId" 
                element={
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/journal" 
                element={
                  <AppLayout>
                    <Journal />
                  </AppLayout>
                } 
              />
              <Route 
                path="/app/wrapped" 
                element={
                  <AppLayout>
                    <YearInFood />
                  </AppLayout>
                } 
              />

              {/* Personal Profile Routes without params */}
              <Route path="/app/profile" element={<MyProfileRoute />} />
              <Route path="/profile" element={<MyProfileRoute />} />

              {/* Profile fallback for /profile/:userId */}
              <Route 
                path="/profile/:userId" 
                element={
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                } 
              />

              {/* Admin Route */}
              <Route 
                path="/admin/seed" 
                element={
                  <AdminRoute>
                    <WebsiteLayout>
                      <AdminSeed />
                    </WebsiteLayout>
                  </AdminRoute>
                } 
              />

              {/* Privacy Policy Routes (Google Play & Web) */}
              <Route path="/privacy" element={<ApecERPPrivacy />} />
              <Route path="/apecerp/privacy" element={<ApecERPPrivacy />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="bottom-right" />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;
