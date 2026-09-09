/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, createContext, useContext, ReactNode, ErrorInfo, Component } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./components/ThemeProvider";
import { StarRating } from "./components/StarRating";
import { Hero } from "./components/Hero";
import { ReviewCard } from "./components/ReviewCard";
import { AdminSeed } from "./components/AdminSeed";
import { Toaster, toast } from "sonner";
import { Review, User as DishdUser } from "./types";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc, getDoc, getDocFromServer, where } from "firebase/firestore";
import { Profile } from "./components/Profile";
import { Restaurant } from "./components/Restaurant";
import { Restaurants } from "./components/Restaurants";
import { Critics } from "./components/Critics";
import { Journal } from "./components/Journal";
import { EditProfileModal } from "./components/EditProfileModal";
import { Navigate } from "react-router-dom";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { useLocation } from "./hooks/useLocation";
import { getCurrentCity } from "./services/mapsService";
import { MapPin, Globe, Star, Loader2, Flame, Sparkles, Utensils, ListOrdered, Award, ArrowRight, Play } from "lucide-react";

// Madeater Ecosystem Additions
import { CravingsFeed } from "./components/CravingsFeed";
import { DishesDirectory } from "./components/DishesDirectory";
import { DishPage } from "./components/DishPage";
import { FoodLists } from "./components/FoodLists";
import { ListDetail } from "./components/ListDetail";
import { FoodMap } from "./components/FoodMap";
import { YearInFood } from "./components/YearInFood";
import { AIFoodAssistant } from "./components/AIFoodAssistant";
import { MOCK_DISHES, MOCK_LISTS, MOCK_CRAVINGS, MOCK_CRITICS_DATA } from "./data/mockData";

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

// --- Auth Context ---
interface AuthContextType {
  user: FirebaseUser | null;
  dishdUser: DishdUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dishdUser, setDishdUser] = useState<DishdUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const newUser: DishdUser = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || "Anonymous Critic",
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=random`,
              criticLevel: "Foodie",
              credibilityScore: 85,
              stats: { mealsLogged: 0, reviewsWritten: 0, followers: 0, following: 0, followingList: [] },
              eatlist: [],
              likes: []
            };
            await setDoc(userRef, newUser);
          }
          
          unsubscribeUserDoc = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setDishdUser(snapshot.data() as DishdUser);
            }
          });
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      } else {
        setDishdUser(null);
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Logged in successfully!");
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-blocked') {
        toast.error("Login popup was blocked or cancelled. Please try again.");
      } else {
        console.error("Login error:", error);
        toast.error("Failed to login.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out.");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isOnboarding = !!user && !!dishdUser && !dishdUser.username;

  return (
    <AuthContext.Provider value={{ user, dishdUser, loading, login, logout }}>
      {children}
      {isOnboarding && (
        <EditProfileModal 
          isOpen={true}
          onClose={() => {}} 
          user={dishdUser}
          isOnboarding={true}
        />
      )}
    </AuthContext.Provider>
  );
}

function Home() {
  const { dishdUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"for-you" | "following" | "trending" | "nearby">("for-you");
  const [currentCity, setCurrentCity] = useState<string>("Hyderabad");
  const [isAIOpen, setIsAIOpen] = useState(false);
  const { location } = useLocation();

  useEffect(() => {
    if (location) {
      getCurrentCity(location.latitude, location.longitude).then(city => {
        if (city) setCurrentCity(city);
      });
    }
  }, [location]);

  useEffect(() => {
    let q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(25));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedReviews = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as Review[];

      // Merge with MOCK_CRAVINGS ensuring zero empty feeds
      const existingIds = new Set(fetchedReviews.map(r => r.id));
      const combined = [...fetchedReviews, ...MOCK_CRAVINGS.filter(m => !existingIds.has(m.id))];

      setReviews(combined);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore reviews fallback to mock:", error.message);
      setReviews(MOCK_CRAVINGS);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Filter reviews based on active feedTab
  const displayedReviews = reviews.filter(r => {
    if (feedTab === "for-you") return true;
    if (feedTab === "following") {
      const followingList = dishdUser?.stats?.followingList || ["teja", "priya"];
      return followingList.includes(r.userId);
    }
    if (feedTab === "trending") {
      return (r.likes || 0) > 10 || r.rating >= 9.0;
    }
    if (feedTab === "nearby") {
      return !r.city || r.city.toLowerCase().includes(currentCity.toLowerCase());
    }
    return true;
  });

  return (
    <div className="elite-motion-safe min-h-screen bg-black text-white">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        
        {/* SECTION 17: SIGNATURE DISHES SHOWCASE (The Biggest Madeater Differentiator) */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                Signature Dishes • The Madeater Index
              </h2>
            </div>
            <Link to="/dishes" className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>View All Dishes</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MOCK_DISHES.map((dish) => (
              <Link
                key={dish.id}
                to={`/dish/${dish.id}`}
                className="group rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/50 p-3 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 border border-white/10">
                  <img 
                    src={dish.image} 
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[11px] font-black text-white">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span>{dish.madeaterScore.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                    {dish.name}
                  </h3>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">
                    {dish.topRestaurants[0]?.name || "Top Spot"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 2: CRAVINGS SPOTLIGHT */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                Trending Cravings • Food-First Video
              </h2>
            </div>
            <Link to="/cravings" className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Watch Full Feed</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MOCK_CRAVINGS.slice(0, 4).map((craving) => (
              <Link
                key={craving.id}
                to="/cravings"
                className="group relative aspect-[9/14] rounded-3xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all shadow-xl block"
              >
                <img 
                  src={craving.dishes?.[0]?.image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80"}
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase text-orange-400">
                    {craving.cravingTag || "Craving"}
                  </span>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-orange-500 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                  <Play size={18} className="fill-black ml-0.5" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 space-y-1">
                  <p className="text-xs font-black text-white group-hover:text-orange-400 transition-colors truncate">
                    {craving.attachedDish || craving.restaurantName}
                  </p>
                  <p className="text-[10px] text-white/60 truncate flex items-center gap-1">
                    <MapPin size={10} className="text-orange-400" />
                    {craving.restaurantName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 1: HOME FEED (4 TABS) + SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* 4 FEED TABS: For You / Following / Trending / Nearby */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 sm:gap-4">
                {[
                  { id: "for-you", label: "For You" },
                  { id: "following", label: "Following" },
                  { id: "trending", label: "Trending" },
                  { id: "nearby", label: `Nearby (${currentCity})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFeedTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${
                      feedTab === tab.id
                        ? "bg-white text-black border-white shadow-lg"
                        : "bg-zinc-900/60 text-white/50 border-white/10 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews Stream */}
            <div className="space-y-6">
              {loading ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-400" />
                </div>
              ) : displayedReviews.length > 0 ? (
                displayedReviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <div className="py-24 text-center bg-zinc-900/40 border border-dashed border-white/10 rounded-3xl p-10">
                  <p className="text-white/40 italic font-serif text-lg">No reviews found in this feed tab yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Concierge + Curated Lists + Critics */}
          <div className="space-y-16">
            
            {/* AI Concierge Promo Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-orange-500/30 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Autonomous Assistant</span>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                What are you craving today?
              </h3>
              <p className="text-xs text-white/60 font-serif italic">
                Ask Madeater AI for late-night spicy food, budget hidden gems, or romantic dinner spots.
              </p>
              <button
                onClick={() => setIsAIOpen(true)}
                className="w-full py-3 rounded-full bg-orange-500 text-black font-black uppercase tracking-wider text-xs hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
              >
                Ask Madeater AI →
              </button>
            </div>

            {/* Popular Curated Lists */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Popular Lists</h2>
                <Link to="/lists" className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider">Explore</Link>
              </div>
              <div className="space-y-4">
                {MOCK_LISTS.map((list) => (
                  <Link 
                    to={`/list/${list.id}`} 
                    key={list.id} 
                    className="p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/40 transition-all block group"
                  >
                    <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {list.title}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">
                      by {list.userName} • {list.likes} likes
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Top Verified Critics */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Top Critics</h2>
                <Link to="/critics" className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider">Directory</Link>
              </div>
              <div className="space-y-3">
                {MOCK_CRITICS_DATA.map((critic) => (
                  <Link 
                    to={`/profile/${critic.username || critic.uid}`} 
                    key={critic.uid} 
                    className="p-3.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-white/10 hover:border-orange-500/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={critic.photoURL} 
                        className="w-10 h-10 rounded-full border border-white/20 object-cover" 
                        alt="" 
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {critic.displayName}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          {critic.criticLevel}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-orange-400 shrink-0">
                      {critic.credibilityScore}/100
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <AIFoodAssistant 
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="eatdxr-theme">
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cravings" element={<CravingsFeed />} />
                <Route path="/dishes" element={<DishesDirectory />} />
                <Route path="/dish/:dishId" element={<DishPage />} />
                <Route path="/lists" element={<FoodLists />} />
                <Route path="/list/:listId" element={<ListDetail />} />
                <Route path="/map" element={<FoodMap />} />
                <Route path="/wrapped" element={<YearInFood />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/restaurant/:restaurantId" element={<Restaurant />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/critics" element={<Critics />} />
                <Route path="/journal" element={<Journal />} />
                <Route 
                  path="/admin/seed" 
                  element={
                    <AdminRoute>
                      <AdminSeed />
                    </AdminRoute>
                  } 
                />
                <Route path="*" element={<Home />} />
              </Routes>
            </Layout>
            <MobileBottomNav />
            <Toaster position="bottom-right" />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
