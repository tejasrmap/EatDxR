/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  favoriteCuisines?: string[];
  stats: {
    mealsLogged: number;
    reviewsWritten: number;
    followers: number;
    following: number;
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
  menuItems?: string[];
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
