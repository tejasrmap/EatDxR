/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, createContext, useContext, ReactNode, ErrorInfo, Component } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Layout } from "./components/Layout";
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
import { MapPin, Globe, Star, Loader2 } from "lucide-react";

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
          <h1 className="text-3xl font-bold mb-4 serif italic">Something went wrong.</h1>
          <p className="text-white/60 mb-8 max-w-md">
            {this.state.error?.message.startsWith('{') 
              ? "A database error occurred. Please check your permissions." 
              : this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="nav-pill px-8 py-2"
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
        // Sync user to Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const newUser: DishdUser = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || "Anonymous Critic",
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=random`,
              stats: { mealsLogged: 0, reviewsWritten: 0, followers: 0, following: 0, followingList: [] },
              eatlist: [],
              likes: []
            };
            await setDoc(userRef, newUser);
          }
          
          // Stream updates for live data changes (like following/unfollowing)
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
          onClose={() => {}} // Non-dismissible
          user={dishdUser}
          isOnboarding={true}
        />
      )}
    </AuthContext.Provider>
  );
}

function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "nearby">("all");
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const { location } = useLocation();

  useEffect(() => {
    if (location) {
      getCurrentCity(location.latitude, location.longitude).then(city => {
        if (city) setCurrentCity(city);
      });
    }
  }, [location]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    let q;
    if (filter === "nearby" && currentCity) {
      q = query(
        collection(db, "reviews"), 
        where("city", "==", currentCity),
        orderBy("createdAt", "desc"), 
        limit(20)
      );
    } else {
      q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedReviews = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as Review[];

      if (filter === "nearby" && currentCity) {
        fetchedReviews = fetchedReviews.filter(r => r.city?.toLowerCase() === currentCity.toLowerCase());
      }

      setReviews(fetchedReviews);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "reviews");
    });

    return unsubscribe;
  }, [filter, currentCity]);

  return (
    <div className="elite-motion-safe">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-24">
            
            {/* Popular Meals (Poster Grid) */}
            <section id="popular-meals">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <h2 className="small-caps text-white/40">Popular Meals this Week</h2>
                <Link to="/restaurants" className="small-caps text-white/20 hover:text-white transition-colors">See All Experience</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {reviews.slice(0, 4).map((review, i) => {
                  const dishesWithImages = review.dishes?.filter(d => d.image) || [];
                  const firstImage = dishesWithImages[0]?.image;
                  return (
                    <Link 
                      key={i} 
                      to={`/restaurant/${review.restaurantId}`}
                      className="aspect-[2/3] bg-zinc-900 rounded-lg overflow-hidden border border-white/10 group relative shadow-2xl transition-all duration-500 hover:border-white/20 hover:-translate-y-1 block"
                    >
                      <img 
                        src={firstImage || `https://images.unsplash.com/photo-${[
                          "1504674900247-0877df9cc836",
                          "1476224489451-f8a61e8a93b5",
                          "1493770348161-369560ae357d",
                          "1473093226795-af9932fe5856"
                        ][i]}?auto=format&fit=crop&w=400&q=80`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out grayscale-[20%] group-hover:grayscale-0"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity flex flex-col items-center justify-end p-5 text-center">
                        <StarRating rating={review.rating} size={12} className="flex items-center gap-0.5 text-accent mb-2" />
                        <p className="text-[10px] font-extrabold text-white uppercase tracking-widest line-clamp-1 group-hover:text-accent transition-colors">{review.restaurantName}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Recent Reviews (List) */}
            <section>
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <h2 className="small-caps text-white/40">Recent Reviews from Critics</h2>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setFilter("all")}
                    className={`small-caps transition-colors ${filter === "all" ? "text-white" : "text-white/20 hover:text-white"}`}
                  >
                    Global
                  </button>
                  <button 
                    onClick={() => setFilter("nearby")}
                    className={`small-caps transition-colors ${filter === "nearby" ? "text-white" : "text-white/20 hover:text-white"}`}
                  >
                    Nearby
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="py-24 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-white/10" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <div className="py-24 text-center glass-panel border-dashed p-10">
                    <p className="text-white/30 italic font-serif text-lg">No reviews yet. Be the first to log a meal!</p>
                  </div>
                )}
              </div>
            </section>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-20">
            {/* Trending Cities */}
            <section>
              <h2 className="small-caps text-white/40 mb-8 pb-4 border-b border-white/5">Trending Cities</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Mumbai", img: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=400&q=80" },
                  { name: "Delhi", img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=80" },
                  { name: "Bangalore", img: "https://images.unsplash.com/photo-1596760407110-2f75d0d2475d?auto=format&fit=crop&w=400&q=80" },
                  { name: "Hyderabad", img: "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?auto=format&fit=crop&w=400&q=80" }
                ].map((city, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setCurrentCity(city.name);
                      setFilter("nearby");
                    }}
                    className="group cursor-pointer relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-lg"
                  >
                    <img 
                      src={city.img} 
                      className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-700"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-zinc-950/40 group-hover:bg-zinc-950/10 transition-all flex items-center justify-center">
                      <span className="small-caps text-white drop-shadow-xl">{city.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Lists */}
            <section>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <h2 className="small-caps text-white/40">Popular Food Lists</h2>
                <Link to="/lists" className="small-caps text-white/20 hover:text-white transition-colors">See More</Link>
              </div>
              <div className="space-y-6">
                {[
                  "Best Sushi in Mumbai",
                  "Authentic Street Food Delhi",
                  "Top 10 Cafes Bangalore",
                  "Hidden Gems Hyderabad"
                ].map((list, i) => (
                  <Link to="/lists" key={i} className="group block cursor-pointer">
                    <p className="text-[15px] font-bold text-white/70 group-hover:text-accent transition-all duration-300 mb-1">{list}</p>
                    <p className="small-caps text-[9px] text-white/20 tracking-normal group-hover:text-white/40">1.2k likes • 45 items curated</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Top Critics */}
            <section>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <h2 className="small-caps text-white/40">Top Critics</h2>
                <Link to="/critics" className="small-caps text-white/20 hover:text-white transition-colors">Directory</Link>
              </div>
              <div className="space-y-5">
                {[
                  { id: "arjun", name: "Arjun Mehta", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" },
                  { id: "priya", name: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
                  { id: "vikram", name: "Vikram Singh", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80" },
                  { id: "ananya", name: "Ananya Iyer", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" }
                ].map((critic, i) => (
                  <Link to={`/profile/${critic.id}`} key={i} className="flex items-center gap-4 group cursor-pointer">
                    <img 
                      src={critic.avatar} 
                      className="w-10 h-10 rounded-full grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all border border-white/10 group-hover:border-accent duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-white group-hover:text-accent transition-colors truncate">{critic.name}</p>
                      <p className="small-caps text-[9px] text-white/20 tracking-normal group-hover:text-white/40">Verified Critic • 1.2k entries</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/restaurant/:restaurantId" element={<Restaurant />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/lists" element={<PlaceholderPage title="Food Lists" />} />
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
          <Toaster theme="dark" position="bottom-right" />
        </Router>
      </AuthProvider>
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

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-black uppercase tracking-widest mb-4">{title}</h1>
      <p className="text-white/40 italic serif">This section is coming soon. We're currently curating the best content for you!</p>
      <Link to="/" className="inline-block mt-8 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-white/90 transition-colors">
        Back to Home
      </Link>
    </div>
  );
}


