/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  username?: string;
  pronouns?: string;
  bio?: string;
  favoriteCuisines?: string[];
  eatlist?: string[];
  likes?: string[];
  stats: {
    mealsLogged: number;
    reviewsWritten: number;
    followers: number;
    following: number;
    followingList?: string[];
  };
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
  lat?: number;
  lng?: number;
  distance?: number;
}

export interface ReviewDish {
  name: string;
  image?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation?: string;
  city?: string;
  dishes: ReviewDish[];
  rating: number; // 1-10 or 1-5, let's go with 1-5 half-stars like Letterboxd
  content: string;
  createdAt: any; // Firestore Timestamp
  likes: number;
}

export interface FoodList {
  id: string;
  userId: string;
  title: string;
  description: string;
  restaurantIds: string[];
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

