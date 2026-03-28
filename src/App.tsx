/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, createContext, useContext, ReactNode, ErrorInfo, Component } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Layout } from "./components/Layout";
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
import { Journal } from "./components/Journal";
import { useLocation } from "./hooks/useLocation";
import { getCurrentCity } from "./services/mapsService";
import { MapPin, Globe, Star, Loader2 } from "lucide-react";
import { Critics } from "./components/Critics";

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
              stats: { mealsLogged: 0, reviewsWritten: 0, followers: 0, following: 0 }
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

  return (
    <AuthContext.Provider value={{ user, dishdUser, loading, login, logout }}>
      {children}
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
    // Test connection
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
      // Note: This requires a composite index on city and createdAt
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
    <div>
      <Hero />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Popular Meals (Poster Grid) */}
            <section id="popular-meals">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
                <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Popular Meals this Week</h2>
                <Link to="/restaurants" className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors">More</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {reviews.slice(0, 4).map((review, i) => {
                  const dishesWithImages = review.dishes?.filter(d => d.image) || [];
                  const firstImage = dishesWithImages[0]?.image;
                  return (
                    <Link 
                      key={i} 
                      to={`/restaurant/${review.restaurantId}`}
                      className="aspect-[2/3] bg-zinc-800 rounded-sm overflow-hidden border border-white/10 group relative shadow-lg"
                    >
                      <img 
                        src={firstImage || `https://images.unsplash.com/photo-${[
                          "1504674900247-0877df9cc836",
                          "1476224489451-f8a61e8a93b5",
                          "1493770348161-369560ae357d",
                          "1473093226795-af9932fe5856"
                        ][i]}?auto=format&fit=crop&w=400&q=80`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 transition-opacity text-center">
                        <div className="flex items-center gap-0.5 text-orange-500 mb-2">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={10} fill={j < review.rating ? "currentColor" : "none"} className={j < review.rating ? "fill-orange-500" : "text-white/20"} />
                          ))}
                        </div>
                        <p className="text-[10px] font-bold text-white uppercase tracking-tighter line-clamp-2">{review.restaurantName}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Recent Reviews (List) */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
                <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Recent Reviews from Critics</h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setFilter("all")}
                    className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${filter === "all" ? "text-white" : "text-white/20 hover:text-white"}`}
                  >
                    Global
                  </button>
                  <button 
                    onClick={() => setFilter("nearby")}
                    className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${filter === "nearby" ? "text-white" : "text-white/20 hover:text-white"}`}
                  >
                    Nearby
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/20" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-white/40 italic serif">No reviews yet. Be the first to log a meal!</p>
                  </div>
                )}
              </div>
            </section>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-12">
            {/* Trending Cities */}
            <section>
              <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-6 pb-2 border-b border-white/10">Trending Cities</h2>
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
                    className="group cursor-pointer relative aspect-video rounded-sm overflow-hidden border border-white/10"
                  >
                    <img 
                      src={city.img} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white">{city.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Lists */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Popular Food Lists</h2>
                <Link to="/lists" className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors">More</Link>
              </div>
              <div className="space-y-4">
                {[
                  "Best Sushi in Mumbai",
                  "Authentic Street Food Delhi",
                  "Top 10 Cafes Bangalore",
                  "Hidden Gems Hyderabad"
                ].map((list, i) => (
                  <Link to="/lists" key={i} className="group block cursor-pointer">
                    <p className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{list}</p>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">1.2k likes • 45 items</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Top Critics */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Top Critics</h2>
                <Link to="/critics" className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors">More</Link>
              </div>
              <div className="space-y-4">
                {[
                  { id: "arjun", name: "Arjun Mehta", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" },
                  { id: "priya", name: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
                  { id: "vikram", name: "Vikram Singh", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80" },
                  { id: "ananya", name: "Ananya Iyer", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" }
                ].map((critic, i) => (
                  <Link to={`/profile/${critic.id}`} key={i} className="flex items-center gap-3 group cursor-pointer">
                    <img 
                      src={critic.avatar} 
                      className="w-8 h-8 rounded-full grayscale group-hover:grayscale-0 transition-all border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-xs font-medium group-hover:text-white transition-colors">{critic.name}</p>
                      <p className="text-[10px] text-white/20 uppercase tracking-widest">1.2k reviews</p>
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
              <Route path="/restaurants" element={<PlaceholderPage title="Restaurants" />} />
              <Route path="/lists" element={<PlaceholderPage title="Food Lists" />} />
              <Route path="/critics" element={<Critics />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/admin/seed" element={<AdminSeed />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Layout>
          <Toaster theme="dark" position="bottom-right" />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
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


