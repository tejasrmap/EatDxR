import { RestaurantSearchResult } from "../types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

// Simple in-memory cache
const searchCache = new Map<string, RestaurantSearchResult[]>();
const cityCache = new Map<string, string>();
let cachedFirebaseRestaurants: RestaurantSearchResult[] | null = null;

async function preloadFirebaseRestaurants() {
  if (cachedFirebaseRestaurants) return cachedFirebaseRestaurants;
  try {
    const snap = await getDocs(collection(db, "restaurants"));
    cachedFirebaseRestaurants = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
        name: data.name,
        location: data.location || "Unknown",
        city: data.location ? data.location.split(',').pop()?.trim() : "Unknown",
        cuisine: data.cuisine || "Various",
        menuItems: data.menuItems || [],
        image: data.image
      } as RestaurantSearchResult;
    });
    return cachedFirebaseRestaurants;
  } catch (e) {
    console.error("Failed to preload firebase restaurants", e);
    return [];
  }
}

async function fetchOpenRouter(prompt: string, expectJson: boolean = false) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin, 
      "X-Title": "Madeater", 
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001", // Corrected OpenRouter model path
      messages: [{ role: "user", content: prompt }],
      response_format: expectJson ? { type: "json_object" } : undefined
    })
  });
  
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "OpenRouter API error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function searchRestaurants(query: string, latitude?: number, longitude?: number): Promise<RestaurantSearchResult[]> {
  const cacheKey = `${query.toLowerCase()}_${latitude?.toFixed(2) || 'default'}_${longitude?.toFixed(2) || 'default'}`;
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // 1. Check Native Firebase Database First!
  try {
    const fbRestaurants = await preloadFirebaseRestaurants();
    const lQuery = query.toLowerCase().trim();
    if (lQuery.length > 0) {
      const matched = fbRestaurants.filter(r => 
        r.name.toLowerCase().includes(lQuery) || 
        r.cuisine?.toLowerCase().includes(lQuery) ||
        r.location?.toLowerCase().includes(lQuery)
      );
      
      // If we found local db authentic results, return immediately!
      if (matched.length > 0) {
        // Sort matches (exact name first)
        matched.sort((a,b) => {
          if (a.name.toLowerCase() === lQuery) return -1;
          if (b.name.toLowerCase() === lQuery) return 1;
          return 0;
        });
        const finalResults = matched.slice(0, 5);
        searchCache.set(cacheKey, finalResults);
        return finalResults;
      }
    }
  } catch(e) { console.error("Firebase Search Error:", e); }

  // 2. Fallback to AI Generation if not found locally
  const locationPrompt = (latitude && longitude) 
    ? `near the location at coordinates ${latitude}, ${longitude}.`
    : `in India or globally based on the query.`;

  try {
    const prompt = `Find 5 real food places (restaurants, cafes, or street food) matching "${query}" ${locationPrompt}
    
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
      console.error("Failed to parse JSON from AI response:", text);
    }
    
    const results: RestaurantSearchResult[] = [];
    resultsList.forEach((res: any, i: number) => {
      if (res.name) {
        results.push({
          id: `res_${i}_${Date.now()}`,
          name: res.name,
          location: res.location || "Unknown Location",
          city: res.city || "Nearby",
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
    console.error("Search error via OpenRouter:", error);
    return [];
  }
}

export async function getCurrentCity(latitude: number, longitude: number): Promise<string | null> {
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  if (cityCache.has(cacheKey)) return cityCache.get(cacheKey)!;

  try {
    const prompt = `What is the name of the city or town at coordinates ${latitude}, ${longitude} in India? Return ONLY the name of the city or town (e.g., "Mumbai", "Indiranagar").`;
    const responseText = await fetchOpenRouter(prompt, false);

    const city = responseText.trim().split('\n')[0].replace(/[^\w\s]/gi, '') || null;
    if (city && city.toLowerCase() !== 'nearby') {
      cityCache.set(cacheKey, city);
      return city;
    }
    return null;
  } catch (error) {
    return null;
  }
}
