import { DishEntity, FoodList, Review, User, CriticLevel } from "../types";

export const MOCK_DISHES: DishEntity[] = [
  {
    id: "chicken-biryani",
    name: "Hyderabadi Chicken Dum Biryani",
    cuisine: "Hyderabadi / Mughlai",
    madeaterScore: 9.3,
    reviewCount: 3420,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    description: "Slow-cooked basmati rice layered with marinated tender chicken, saffron milk, fried onions, and whole aromatic spices sealed under dough.",
    tags: ["Iconic", "Spicy", "Biryani", "Crowd Favorite"],
    ratings: {
      taste: 9.6,
      spice: 9.1,
      portion: 9.2,
      value: 8.9
    },
    topRestaurants: [
      { id: "bawarchi-rtc", name: "Bawarchi", score: 9.6, location: "RTC X Roads, Hyderabad", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80" },
      { id: "shadab-oldcity", name: "Hotel Shadab", score: 9.4, location: "Ghansi Bazaar, Old City", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&q=80" },
      { id: "cafe-bahar", name: "Cafe Bahar", score: 9.2, location: "Hyderguda, Hyderabad", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80" },
      { id: "shah-ghouse", name: "Shah Ghouse Cafe", score: 9.1, location: "Tolichowki, Hyderabad", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "ghee-roast-dosa",
    name: "Neyi Karam Ghee Roast Dosa",
    cuisine: "South Indian",
    madeaterScore: 9.2,
    reviewCount: 2180,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    description: "Ultra-crisp fermented rice-lentil crepe slathered in fragrant pure desi ghee and fiery red garlic chutney powder, served with coconut and tomato chutneys.",
    tags: ["Breakfast", "Crispy", "Ghee", "Comfort Food"],
    ratings: {
      taste: 9.5,
      spice: 8.4,
      portion: 8.8,
      value: 9.6
    },
    topRestaurants: [
      { id: "rameshwaram-cafe", name: "The Rameshwaram Cafe", score: 9.6, location: "Indiranagar, Bangalore", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80" },
      { id: "chutneys-hyderabad", name: "Chutneys", score: 9.3, location: "Banjara Hills, Hyderabad", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80" },
      { id: "ram-ki-bandi", name: "Ram Ki Bandi", score: 9.2, location: "Mozamjahi Market, Hyderabad", image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "mutton-haleem",
    name: "Royal Mutton Haleem",
    cuisine: "Hyderabadi / Nizam",
    madeaterScore: 9.7,
    reviewCount: 4210,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    description: "Slow-pounded wheat, barley, tender meat, and aromatic spices cooked for 12 hours over open fire, crowned with pure ghee, fried cashews, and mint.",
    tags: ["Royal", "Velvety", "Slow Cooked", "Legendary"],
    ratings: {
      taste: 9.8,
      spice: 9.2,
      portion: 9.4,
      value: 9.1
    },
    topRestaurants: [
      { id: "pista-house", name: "Pista House", score: 9.8, location: "Charminar, Hyderabad", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80" },
      { id: "cafe-555", name: "Cafe 555", score: 9.6, location: "Masab Tank, Hyderabad", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80" },
      { id: "sarvi", name: "Sarvi Restaurant", score: 9.4, location: "Banjara Hills, Hyderabad", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "butter-garlic-crab",
    name: "Coastal Butter Garlic Crab",
    cuisine: "Seafood / Konkan",
    madeaterScore: 9.4,
    reviewCount: 1540,
    image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80",
    description: "Fresh mud crabs cracked and tossed in a rich emulsified pool of butter, crushed roasted garlic, and cracked pepper.",
    tags: ["Decadent", "Seafood", "Indulgence"],
    ratings: {
      taste: 9.7,
      spice: 7.6,
      portion: 8.5,
      value: 8.2
    },
    topRestaurants: [
      { id: "trishna-mumbai", name: "Trishna", score: 9.7, location: "Kala Ghoda, Mumbai", image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80" },
      { id: "mahesh-lunch-home", name: "Mahesh Lunch Home", score: 9.4, location: "Fort, Mumbai", image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "filter-coffee",
    name: "Artisanal South Indian Filter Coffee",
    cuisine: "Beverage / Heritage",
    madeaterScore: 9.5,
    reviewCount: 3890,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    description: "Dark-roasted chicory blend brewed via brass percolator, frothed into whole milk in a traditional davarah and tumbler.",
    tags: ["Ritual", "Morning", "Heritage", "Caffeine"],
    ratings: {
      taste: 9.7,
      spice: 0.0,
      portion: 8.5,
      value: 9.7
    },
    topRestaurants: [
      { id: "brahmins-coffee", name: "Brahmin's Coffee Bar", score: 9.8, location: "Shankarapura, Bangalore", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80" },
      { id: "subko-coffee", name: "Subko Specialty Coffee", score: 9.6, location: "Bandra, Mumbai", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "gongura-mutton",
    name: "Andhra Gongura Mutton",
    cuisine: "Andhra",
    madeaterScore: 9.6,
    reviewCount: 1870,
    image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
    description: "Fiery braised mutton infused with sour sorrel leaves (gongura), dry red Guntur chillies, and mustard-garlic tadka.",
    tags: ["Extreme Spice", "Sour & Fiery", "Cult Classic"],
    ratings: {
      taste: 9.8,
      spice: 9.9,
      portion: 9.0,
      value: 9.1
    },
    topRestaurants: [
      { id: "ulavacharu", name: "Ulavacharu", score: 9.7, location: "Jubilee Hills, Hyderabad", image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=400&q=80" },
      { id: "rayalaseema-ruchulu", name: "Rayalaseema Ruchulu", score: 9.5, location: "Hitec City, Hyderabad", image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=400&q=80" }
    ]
  }
];

export const MOCK_LISTS: FoodList[] = [
  {
    id: "hyderabad-biryani-canon",
    userId: "teja",
    userName: "Teja G.",
    userPhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    title: "The Definitive Hyderabad Biryani Canon",
    description: "Ranked not by hype, but by rice moisture, mutton marination tenderness, and saffron balance. The true soul of Nizam cuisine.",
    coverImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    isRanked: true,
    isPublic: true,
    likes: 1842,
    tags: ["Hyderabad", "Biryani", "Masterlist", "Ranked"],
    createdAt: new Date("2026-08-15").toISOString(),
    items: [
      { id: "bawarchi-rtc", name: "Bawarchi (RTC X Roads)", type: "restaurant", score: 9.6, note: "Order the Chicken Dum Biryani with extra mirchi ka salan. Go before 1 PM.", location: "RTC X Roads, Hyderabad" },
      { id: "shadab-oldcity", name: "Hotel Shadab", type: "restaurant", score: 9.4, note: "The mutton biryani here has unmatched saffron depth. Pair with brain fry.", location: "Ghansi Bazaar, Hyderabad" },
      { id: "cafe-bahar", name: "Cafe Bahar", type: "restaurant", score: 9.2, note: "Iconic spice punch, perfectly caramelized onions.", location: "Hyderguda, Hyderabad" },
      { id: "shah-ghouse", name: "Shah Ghouse", type: "restaurant", score: 9.1, note: "The midnight staple for late-night cravings.", location: "Tolichowki, Hyderabad" }
    ]
  },
  {
    id: "budget-under-500",
    userId: "priya",
    userName: "Priya Sharma",
    userPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    title: "Culinary Gold Under ₹500",
    description: "Proof that world-class flavor doesn't require five-star wallets. Tested and verified street carts, legacy tiffin rooms, and hidden cafes.",
    coverImage: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    isRanked: false,
    isPublic: true,
    likes: 2410,
    tags: ["Budget", "Under ₹500", "Street Food", "Value"],
    createdAt: new Date("2026-08-20").toISOString(),
    items: [
      { id: "ram-ki-bandi", name: "Ram Ki Bandi Ghee Dosa", type: "dish", score: 9.2, note: "₹120 of molten butter bliss at 3:00 AM.", location: "Hyderabad" },
      { id: "brahmins-coffee", name: "Brahmin's Idli Vada Combo", type: "dish", score: 9.8, note: "Fluffiest idli on Earth bathed in coconut chutney for ₹70.", location: "Bangalore" },
      { id: "al-jawaher", name: "Al Jawaher Mutton Korma", type: "restaurant", score: 9.4, note: "Old Delhi richness with rumali roti under ₹400.", location: "Jama Masjid, Delhi" }
    ]
  },
  {
    id: "date-night-gems",
    userId: "vikram",
    userName: "Vikram Singh",
    userPhoto: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
    title: "Low-Light, High-Impact Date Night Havens",
    description: "Atmospheric sanctuaries where the lighting is flattering, acoustic noise levels allow deep conversation, and the wine & plates exceed expectations.",
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    isRanked: true,
    isPublic: true,
    likes: 980,
    tags: ["Date Night", "Ambience", "Wine", "Cocktails"],
    createdAt: new Date("2026-08-28").toISOString(),
    items: [
      { id: "trishna-mumbai", name: "Trishna (Kala Ghoda)", type: "restaurant", score: 9.7, note: "Legendary seafood in an intimate historic room.", location: "Mumbai" },
      { id: "olive-bar-kitchen", name: "Olive Bar & Kitchen", type: "restaurant", score: 9.3, note: "Candlelit white pebble courtyard, impeccable sourdough.", location: "Bandra, Mumbai" },
      { id: "fat-pigeon", name: "Fat Pigeon Bar Hop", type: "restaurant", score: 9.0, note: "Cozy cocktail corners with artisan tapas.", location: "Jubilee Hills, Hyderabad" }
    ]
  },
  {
    id: "specialty-coffee-india",
    userId: "ananya",
    userName: "Ananya Iyer",
    userPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    title: "Third-Wave Roasteries Shaping Indian Coffee",
    description: "Single-origin estate beans, anaerobic ferments, and dialled espresso extractions from Chikmagalur to Bandra.",
    coverImage: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    isRanked: true,
    isPublic: true,
    likes: 1540,
    tags: ["Coffee", "Artisanal", "Caffeine", "Roasteries"],
    createdAt: new Date("2026-09-01").toISOString(),
    items: [
      { id: "subko-coffee", name: "Subko Coffee Roasters", type: "restaurant", score: 9.6, note: "Order the Bloom Pour-over with their sourdough croissant.", location: "Bandra West, Mumbai" },
      { id: "blue-tokai", name: "Blue Tokai Coffee", type: "restaurant", score: 9.2, note: "Consistent estate roasts and cold brew tonic.", location: "Multiple Cities" }
    ]
  }
];

export const MOCK_CRAVINGS: Review[] = [
  {
    id: "craving-biryani-reaction",
    userId: "teja",
    userName: "Teja G.",
    userPhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    userCriticLevel: "Madeater Top Critic",
    restaurantId: "bawarchi-rtc",
    restaurantName: "Bawarchi",
    restaurantLocation: "RTC X Roads, Hyderabad",
    city: "Hyderabad",
    rating: 9.6,
    content: "The first bite of this pot-seal Chicken Dum Biryani gave me goosebumps. Look at that rice separation and the ghee glistening on the meat.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cooking-a-steak-in-a-pan-44011-large.mp4",
    createdAt: new Date("2026-09-08T14:30:00Z").toISOString(),
    likes: 482,
    type: "craving",
    cravingTag: "First bite reaction",
    attachedDish: "Hyderabadi Chicken Dum Biryani",
    attachedCuisine: "Hyderabadi",
    attachedScore: 9.6,
    isVerifiedVisit: true,
    visitProofType: "receipt",
    ratingsDetail: { taste: 9.8, quality: 9.5, portion: 9.4, value: 9.2, presentation: 9.0, service: 8.8, ambience: 8.0, spice: 9.2 },
    dishes: [{ name: "Chicken Dum Biryani", rating: 5, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80" }]
  },
  {
    id: "craving-dosa-crackle",
    userId: "priya",
    userName: "Priya Sharma",
    userPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    userCriticLevel: "Verified Critic",
    restaurantId: "rameshwaram-cafe",
    restaurantName: "The Rameshwaram Cafe",
    restaurantLocation: "Indiranagar, Bangalore",
    city: "Bangalore",
    rating: 9.4,
    content: "Listen to that crunch! You can literally hear the crispy ghee crust shatter under the spoon. Dipped straight into garlic podi chutney.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-pizza-being-cut-with-a-slicer-44171-large.mp4",
    createdAt: new Date("2026-09-07T09:15:00Z").toISOString(),
    likes: 619,
    type: "craving",
    cravingTag: "Worth it?",
    attachedDish: "Neyi Karam Ghee Roast Dosa",
    attachedCuisine: "South Indian",
    attachedScore: 9.4,
    isVerifiedVisit: true,
    visitProofType: "qr",
    ratingsDetail: { taste: 9.6, quality: 9.2, portion: 8.9, value: 9.5, presentation: 8.7, service: 9.0, ambience: 7.9 },
    dishes: [{ name: "Ghee Podi Roast Dosa", rating: 5, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80" }]
  },
  {
    id: "craving-subko-pour",
    userId: "ananya",
    userName: "Ananya Iyer",
    userPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    userCriticLevel: "Madeater Critic",
    restaurantId: "subko-coffee",
    restaurantName: "Subko Specialty Coffee",
    restaurantLocation: "Bandra, Mumbai",
    city: "Mumbai",
    rating: 9.5,
    content: "Slow pour-over with Meghalaya single origin beans. Notes of stone fruit, wild honey, and toasted cocoa. Mind blown.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-red-wine-into-a-glass-44140-large.mp4",
    createdAt: new Date("2026-09-06T16:00:00Z").toISOString(),
    likes: 395,
    type: "craving",
    cravingTag: "Behind the scenes",
    attachedDish: "Single Origin Pour-over",
    attachedCuisine: "Coffee",
    attachedScore: 9.5,
    isVerifiedVisit: true,
    visitProofType: "pos",
    ratingsDetail: { taste: 9.7, quality: 9.8, portion: 8.5, value: 8.9, presentation: 9.8, service: 9.5, ambience: 9.6 },
    dishes: [{ name: "Bloom Chemex Pour-over", rating: 5, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80" }]
  },
  {
    id: "craving-haleem-stir",
    userId: "vikram",
    userName: "Vikram Singh",
    userPhoto: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
    userCriticLevel: "Food Critic",
    restaurantId: "pista-house",
    restaurantName: "Pista House",
    restaurantLocation: "Charminar, Hyderabad",
    city: "Hyderabad",
    rating: 9.7,
    content: "12 hours of wooden mashing produces this silky, stretchy texture that coats your palate with pure meat essence and ghee.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-creamy-liquid-41000-large.mp4",
    createdAt: new Date("2026-09-05T20:10:00Z").toISOString(),
    likes: 852,
    type: "craving",
    cravingTag: "Hidden restaurant",
    attachedDish: "Royal Mutton Haleem",
    attachedCuisine: "Hyderabadi",
    attachedScore: 9.7,
    isVerifiedVisit: true,
    visitProofType: "receipt",
    ratingsDetail: { taste: 9.9, quality: 9.7, portion: 9.4, value: 9.2, presentation: 9.0, service: 8.6, ambience: 8.2, spice: 9.0 },
    dishes: [{ name: "Special Pista Haleem", rating: 5, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80" }]
  }
];

export const MOCK_CRITICS_DATA: User[] = [
  {
    uid: "teja",
    displayName: "Teja G.",
    username: "teja",
    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    bio: "Chief Gastronomic Cartographer. Hunting the finest biryanis, sour gongura curries, and third-wave beans across the subcontinent.",
    pronouns: "he/him",
    favoriteCuisines: ["Hyderabadi", "Andhra", "Coastal Seafood", "Specialty Coffee"],
    criticLevel: "Madeater Top Critic",
    credibilityScore: 98,
    isVerifiedCritic: true,
    tasteDNA: {
      spice: 96,
      indian: 94,
      nonVeg: 88,
      asian: 79,
      desserts: 42,
      coffee: 92,
      personaTitle: "The Spice Hunter & Biryani Purist"
    },
    stats: {
      mealsLogged: 342,
      reviewsWritten: 128,
      followers: 1420,
      following: 88,
      followingList: ["priya", "vikram", "ananya"]
    }
  },
  {
    uid: "priya",
    displayName: "Priya Sharma",
    username: "priyasharma",
    photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    bio: "Street food archivist & South Indian breakfast enthusiast. If it's crisp and soaked in ghee, I'm already in line.",
    pronouns: "she/her",
    favoriteCuisines: ["South Indian", "Street Food", "Chaat", "Desserts"],
    criticLevel: "Madeater Critic",
    credibilityScore: 94,
    isVerifiedCritic: true,
    tasteDNA: {
      spice: 82,
      indian: 96,
      nonVeg: 40,
      asian: 68,
      desserts: 90,
      coffee: 85,
      personaTitle: "The Ghee & Fermentation Connoisseur"
    },
    stats: {
      mealsLogged: 420,
      reviewsWritten: 195,
      followers: 2180,
      following: 110,
      followingList: ["teja", "ananya"]
    }
  },
  {
    uid: "vikram",
    displayName: "Vikram Singh",
    username: "vikramfood",
    photoURL: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80",
    bio: "Food historian & slow-food advocate. Evaluating dining rooms by nuance, heritage, and cellar balance.",
    pronouns: "he/him",
    favoriteCuisines: ["Mughlai", "Awadhi", "French", "Continental"],
    criticLevel: "Verified Critic",
    credibilityScore: 92,
    isVerifiedCritic: true,
    tasteDNA: {
      spice: 74,
      indian: 85,
      nonVeg: 92,
      asian: 70,
      desserts: 60,
      coffee: 78,
      personaTitle: "The Classical Gastronome"
    },
    stats: {
      mealsLogged: 290,
      reviewsWritten: 114,
      followers: 980,
      following: 64,
      followingList: ["teja", "priya"]
    }
  },
  {
    uid: "ananya",
    displayName: "Ananya Iyer",
    username: "ananyaiyer",
    photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    bio: "Sensory coffee judge & modern pastry fanatic. Decoding acidity, extraction yield, and laminated doughs.",
    pronouns: "she/her",
    favoriteCuisines: ["Specialty Coffee", "Japanese", "Modern European", "Pastry"],
    criticLevel: "Madeater Critic",
    credibilityScore: 95,
    isVerifiedCritic: true,
    tasteDNA: {
      spice: 55,
      indian: 60,
      nonVeg: 50,
      asian: 94,
      desserts: 95,
      coffee: 99,
      personaTitle: "The Third-Wave Alchemist"
    },
    stats: {
      mealsLogged: 365,
      reviewsWritten: 160,
      followers: 1840,
      following: 102,
      followingList: ["teja", "priya", "vikram"]
    }
  }
];
