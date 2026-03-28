import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { RestaurantSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple in-memory cache
const searchCache = new Map<string, RestaurantSearchResult[]>();
const cityCache = new Map<string, string>();

export async function searchRestaurants(query: string, latitude?: number, longitude?: number): Promise<RestaurantSearchResult[]> {
  const cacheKey = `${query.toLowerCase()}_${latitude?.toFixed(2) || 'default'}_${longitude?.toFixed(2) || 'default'}`;
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  const locationPrompt = (latitude && longitude) 
    ? `near the location at coordinates ${latitude}, ${longitude}.`
    : `in India or globally based on the query.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 5 real food places (restaurants, cafes, or street food) matching "${query}" ${locationPrompt}
      
      Return a raw JSON array of objects. Each object MUST contain EXACTLY these keys:
      - "name": string
      - "location": string (full address)
      - "city": string (city name)
      - "cuisine": string
      - "menuItems": array of strings (3-4 popular dishes)
      - "image": string (a high-quality real unsplash image URL for this specific cuisine)
      
      Do NOT return markdown blocks. Just return the raw JSON array.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.replace(/```json/gi, '').replace(/```/g, '').trim() || "[]";
    let resultsList = [];
    try {
      resultsList = JSON.parse(text);
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
    console.error("Search error:", error);
    return [];
  }
}

export async function getCurrentCity(latitude: number, longitude: number): Promise<string | null> {
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  if (cityCache.has(cacheKey)) return cityCache.get(cacheKey)!;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `What is the name of the city or town at coordinates ${latitude}, ${longitude} in India? Return ONLY the name of the city or town (e.g., "Mumbai", "Indiranagar").`,
    });

    const city = response.text?.trim().split('\n')[0].replace(/[^\w\s]/gi, '') || null;
    if (city && city.toLowerCase() !== 'nearby') {
      cityCache.set(cacheKey, city);
      return city;
    }
    return null;
  } catch (error) {
    return null;
  }
}
