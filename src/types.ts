/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CriticLevel = 
  | "Foodie" 
  | "Food Explorer" 
  | "Reviewer" 
  | "Food Critic" 
  | "Verified Critic" 
  | "Madeater Critic" 
  | "Madeater Top Critic";

export interface TasteDNA {
  spice: number; // 0-100%
  indian: number; // 0-100%
  nonVeg: number; // 0-100%
  asian: number; // 0-100%
  desserts: number; // 0-100%
  coffee: number; // 0-100%
  personaTitle: string; // e.g. "The Spice Hunter", "The Gastronomic Purist"
}

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  email?: string;
  username?: string;
  pronouns?: string;
  bio?: string;
  favoriteCuisines?: string[];
  eatlist?: string[]; // Restaurant IDs or Dish IDs
  likes?: string[];
  criticLevel?: CriticLevel;
  credibilityScore?: number; // 0-100
  isVerifiedCritic?: boolean;
  tasteDNA?: TasteDNA;
  stats: {
    mealsLogged: number;
    reviewsWritten: number;
    followers: number;
    following: number;
    followingList?: string[];
  };
  createdAt?: string;
}

export interface RankedDishSummary {
  name: string;
  score: number; // e.g. 9.4 out of 10
  votes: number;
  image?: string;
  isMustOrder?: boolean;
  flavorTags?: string[];
  recommendationRate?: number; // e.g. 96%
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  reviewCount: number;
  image?: string;
  likesCount?: number;
  menuItems?: string[];
  mustOrderDishes?: RankedDishSummary[];
  lat?: number;
  lng?: number;
  distance?: number;
  priceLevel?: "₹" | "₹₹" | "₹₹₹" | "₹₹₹₹";
  hours?: string;
  signatureDish?: string;
}

export interface ReviewDish {
  name: string;
  image?: string;
  rating?: number; // Per-dish rating (1-10 or 1-5)
  isMustOrder?: boolean;
  flavorTags?: string[];
  comment?: string;
}

export interface DetailedRatings {
  taste: number;
  quality: number;
  portion: number;
  value: number;
  presentation?: number;
  service?: number;
  ambience?: number;
  spice?: number;
}

export type CravingTag = 
  | "First bite reaction"
  | "Restaurant review"
  | "Dish review"
  | "Chef interview"
  | "Worth it?"
  | "₹500 food challenge"
  | "Hidden restaurant"
  | "Spicy food challenge"
  | "Dessert review"
  | "Top 5 restaurants"
  | "Food travel"
  | "Behind the scenes"
  | "Street Food";

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  userCriticLevel?: CriticLevel;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation?: string;
  city?: string;
  dishes: ReviewDish[];
  rating: number; // 1-10 or 1-5 (Letterboxd style)
  content: string;
  videoUrl?: string; // Short-form video for Cravings
  createdAt: any; // Firestore Timestamp
  likes: number;
  
  // Rich Food Ecosystem additions
  type?: "review" | "craving" | "post" | "diary";
  ratingsDetail?: DetailedRatings;
  isVerifiedVisit?: boolean;
  visitProofType?: "qr" | "reservation" | "receipt" | "pos" | "self";
  cravingTag?: CravingTag;
  attachedDish?: string;
  attachedCuisine?: string;
  attachedScore?: number;
  repostOf?: string;
  repostComment?: string;
}

export interface DishEntity {
  id: string;
  name: string;
  cuisine: string;
  madeaterScore: number;
  reviewCount: number;
  image: string;
  description: string;
  tags: string[];
  ratings: {
    taste: number;
    spice: number;
    portion: number;
    value: number;
  };
  topRestaurants: {
    id: string;
    name: string;
    score: number;
    location: string;
    image?: string;
  }[];
}

export interface FoodListItem {
  id: string;
  name: string;
  type: "restaurant" | "dish";
  score?: number;
  note?: string;
  location?: string;
  image?: string;
}

export interface FoodList {
  id: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  title: string;
  description: string;
  coverImage?: string;
  restaurantIds?: string[];
  items?: FoodListItem[];
  isRanked?: boolean;
  isPublic?: boolean;
  tags?: string[];
  likes: number;
  createdAt: any;
}

export interface RestaurantSearchResult {
  name: string;
  cuisine: string;
  location: string;
  city?: string;
  id?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  mapsUrl?: string;
  menuItems?: string[];
}

export interface Interaction {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  type: "LIKE" | "COMMENT";
  content?: string; // Only used if type is "COMMENT"
  createdAt: any; // Firestore Timestamp
}

export interface AppNotification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPhoto: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  targetId?: string; // ID of the review if applicable
  read: boolean;
  createdAt: any;
}
