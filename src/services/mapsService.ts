import { Restaurant, RestaurantSearchResult } from "../types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { GLOBAL_RESTAURANTS, GLOBAL_CITIES, GlobalRestaurant } from "../data/globalRestaurants";
import { getDistanceKM } from "../lib/distance";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

// In-memory caches for high-speed zero-lag lookups
const searchCache = new Map<string, RestaurantSearchResult[]>();
const cityCache = new Map<string, string>();
let cachedFirebaseRestaurants: RestaurantSearchResult[] | null = null;

/**
 * Preload and merge Firebase custom added restaurants with the Global Restaurant dataset
 */
export async function preloadAllRestaurants(): Promise<RestaurantSearchResult[]> {
  if (cachedFirebaseRestaurants && cachedFirebaseRestaurants.length > 0) {
    return cachedFirebaseRestaurants;
  }

  const globalFormatted: RestaurantSearchResult[] = GLOBAL_RESTAURANTS.map(gr => ({
    id: gr.id,
    name: gr.name,
    location: gr.location,
    city: gr.city,
    cuisine: gr.cuisine,
    menuItems: gr.signatureDishes || [],
    image: gr.image,
    lat: gr.lat,
    lng: gr.lng,
    rating: gr.rating,
    priceLevel: gr.priceLevel
  } as RestaurantSearchResult & { lat?: number; lng?: number; rating?: number; priceLevel?: string }));

  try {
    const snap = await getDocs(collection(db, "restaurants"));
    const fbList = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
        name: data.name,
        location: data.location || "Unknown",
        city: data.city || (data.location ? data.location.split(',').pop()?.trim() : "Unknown"),
        cuisine: data.cuisine || "Various",
        menuItems: data.menuItems || data.signatureDishes || [],
        image: data.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        lat: data.lat,
        lng: data.lng,
        rating: data.rating || 4.5,
        priceLevel: data.priceLevel || "₹₹"
      } as RestaurantSearchResult;
    });

    // Merge without duplicates
    const idSet = new Set(fbList.map(r => r.id));
    const merged = [...fbList, ...globalFormatted.filter(r => !idSet.has(r.id))];
    cachedFirebaseRestaurants = merged;
    return merged;
  } catch (e) {
    console.warn("Firestore unavailable, using offline global directory", e);
    cachedFirebaseRestaurants = globalFormatted;
    return globalFormatted;
  }
}

/**
 * OpenRouter AI completion helper for worldwide food queries
 */
async function fetchOpenRouter(prompt: string, expectJson: boolean = false): Promise<string> {
  if (!OPENROUTER_API_KEY) return "";
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, 
        "X-Title": "Madeater", 
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
        response_format: expectJson ? { type: "json_object" } : undefined
      })
    });
    
    if (!response.ok) return "";
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("OpenRouter API fetch failed", e);
    return "";
  }
}

/**
 * Live worldwide discovery of nearest best restaurants based on GPS coordinates
 */
export async function getNearbyRestaurants(
  latitude: number, 
  longitude: number, 
  radiusKm: number = 25,
  limitCount: number = 20
): Promise<(Restaurant & { distance: number })[]> {
  const allRestaurants = await preloadAllRestaurants();

  // 1. Calculate Haversine distance for all catalogued restaurants
  const calculated = allRestaurants
    .map(r => {
      const lat = (r as any).lat;
      const lng = (r as any).lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const distance = getDistanceKM(latitude, longitude, lat, lng);
        return {
          id: r.id,
          name: r.name,
          cuisine: r.cuisine || "Gourmet",
          location: r.location,
          city: r.city,
          rating: (r as any).rating || 4.7,
          reviewCount: (r as any).reviewCount || 500,
          priceLevel: (r as any).priceLevel || "₹₹",
          image: r.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
          lat,
          lng,
          distance
        } as Restaurant & { distance: number };
      }
      return null;
    })
    .filter((r): r is Restaurant & { distance: number } => r !== null);

  // 2. Filter within radius or sort by closest if outside radius
  const inRadius = calculated.filter(r => r.distance <= radiusKm);
  
  if (inRadius.length >= 3) {
    // Sort by a composite score: Proximity + Rating
    return inRadius.sort((a, b) => a.distance - b.distance).slice(0, limitCount);
  }

  // If few spots within strict radius, return closest global spots ordered by distance
  return calculated.sort((a, b) => a.distance - b.distance).slice(0, limitCount);
}

/**
 * Search restaurants worldwide with query matching, cuisine filters & GPS sorting
 */
export async function searchRestaurants(query: string, latitude?: number, longitude?: number): Promise<RestaurantSearchResult[]> {
  const cacheKey = `${query.toLowerCase()}_${latitude?.toFixed(2) || 'default'}_${longitude?.toFixed(2) || 'default'}`;
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  const lQuery = query.toLowerCase().trim();
  const allRestaurants = await preloadAllRestaurants();

  // 1. Match from Local & Global database
  if (lQuery.length > 0) {
    const matched = allRestaurants.filter(r => 
      r.name.toLowerCase().includes(lQuery) || 
      r.cuisine?.toLowerCase().includes(lQuery) ||
      r.location?.toLowerCase().includes(lQuery) ||
      (r.city && r.city.toLowerCase().includes(lQuery)) ||
      (r.menuItems && r.menuItems.some(m => m.toLowerCase().includes(lQuery)))
    );

    if (matched.length > 0) {
      if (latitude && longitude) {
        matched.sort((a, b) => {
          const latA = (a as any).lat;
          const lngA = (a as any).lng;
          const latB = (b as any).lat;
          const lngB = (b as any).lng;
          const distA = (latA && lngA) ? getDistanceKM(latitude, longitude, latA, lngA) : 99999;
          const distB = (latB && lngB) ? getDistanceKM(latitude, longitude, latB, lngB) : 99999;
          return distA - distB;
        });
      }

      const finalResults = matched.slice(0, 10);
      searchCache.set(cacheKey, finalResults);
      return finalResults;
    }
  }

  // 2. Worldwide AI Fallback for uncatalogued cities/dishes
  const locationPrompt = (latitude && longitude) 
    ? `near the location at coordinates ${latitude}, ${longitude}.`
    : `in the culinary world matching the query.`;

  try {
    const prompt = `Find 5 real iconic food places (restaurants, cafes, or street food) matching "${query}" ${locationPrompt}
    
    Return a raw JSON object containing a single key "results" which holds an array of objects. Each object MUST contain EXACTLY these keys:
    - "name": string
    - "location": string (full address)
    - "city": string (city name)
    - "cuisine": string
    - "menuItems": array of strings (3-4 popular dishes)
    - "image": string (a high-quality real unsplash image URL for this specific cuisine)
    
    Do NOT return markdown blocks. Just return the valid JSON object.`;

    const responseText = await fetchOpenRouter(prompt, true);

    const text = responseText.replace(/```json/gi, '').replace(/```/g, '').trim() || '{"results":[]}';
    let resultsList = [];
    try {
      const parsed = JSON.parse(text);
      resultsList = parsed.results || [];
    } catch(e) {
      console.warn("Failed to parse JSON from AI response:", text);
    }
    
    const results: RestaurantSearchResult[] = [];
    resultsList.forEach((res: any, i: number) => {
      if (res.name) {
        results.push({
          id: `res_ai_${i}_${Date.now()}`,
          name: res.name,
          location: res.location || "World Cuisine Landmark",
          city: res.city || "Global",
          cuisine: res.cuisine || "Various",
          menuItems: Array.isArray(res.menuItems) ? res.menuItems : [],
          image: res.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
        });
      }
    });

    const finalResults = results.slice(0, 5);
    searchCache.set(cacheKey, finalResults);
    return finalResults;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Worldwide Reverse Geocoder to detect City & Country anywhere on Earth
 */
export async function getCurrentCity(latitude: number, longitude: number): Promise<string | null> {
  const cacheKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
  if (cityCache.has(cacheKey)) return cityCache.get(cacheKey)!;

  // 1. Check proximity against our curated Global Cities list (< 40km)
  for (const city of GLOBAL_CITIES) {
    const dist = getDistanceKM(latitude, longitude, city.lat, city.lng);
    if (dist < 40) {
      cityCache.set(cacheKey, city.name);
      return city.name;
    }
  }

  // 2. Query OpenStreetMap Nominatim reverse geocoding
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
      headers: { "Accept-Language": "en" }
    });
    if (res.ok) {
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.suburb || data.address?.state;
      if (city) {
        cityCache.set(cacheKey, city);
        return city;
      }
    }
  } catch (e) {
    console.warn("OSM Nominatim lookup failed", e);
  }

  // 3. Fallback to OpenRouter AI Geocoder
  try {
    const prompt = `What is the name of the city or town at coordinates ${latitude}, ${longitude}? Return ONLY the short name of the city (e.g. "Tokyo", "London", "Hyderabad").`;
    const responseText = await fetchOpenRouter(prompt, false);

    const city = responseText.trim().split('\n')[0].replace(/[^\w\s-]/gi, '') || null;
    if (city && city.toLowerCase() !== 'nearby' && city.length < 30) {
      cityCache.set(cacheKey, city);
      return city;
    }
  } catch (e) {
    console.warn("AI Geocoder failed", e);
  }

  return null;
}
