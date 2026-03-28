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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 5 real food places (restaurants, cafes, or street food) matching "${query}" near the location at coordinates ${latitude}, ${longitude} in India.
      
      For each place, you MUST provide:
      1. The specific street address or area name.
      2. A list of 3-4 most popular or signature dishes/menu items.
      
      Format your response EXACTLY like this for each result:
      NAME: [Restaurant Name] | ADDRESS: [Full Address or Specific Area, City] | CUISINE: [Cuisine Type] | MENU: [Dish 1, Dish 2, Dish 3] | IMAGE: [A high-quality Unsplash photo URL specifically for this restaurant or its cuisine type, e.g., https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=800&q=80]`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude || 20.5937,
              longitude: longitude || 78.9629
            }
          }
        }
      },
    });

    const results: RestaurantSearchResult[] = [];
    const text = response.text || "";
    const lines = text.split('\n');

    lines.forEach((line: string, i: number) => {
      // Flexible regex to catch NAME, ADDRESS/LOCATION, CUISINE, MENU, and IMAGE
      const match = line.match(/NAME:\s*(.*?)\s*\|\s*(?:ADDRESS|LOCATION):\s*(.*?)\s*\|\s*CUISINE:\s*(.*?)\s*\|\s*MENU:\s*(.*?)\s*\|\s*IMAGE:\s*(.*)/i);
      if (match) {
        const name = match[1].trim();
        const fullAddress = match[2].trim();
        const addressParts = fullAddress.split(',');
        const city = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : fullAddress;
        const menuItems = match[4].split(',').map(item => item.trim()).filter(item => item.length > 0);
        const image = match[5].trim();
        
        results.push({
          id: `res_${i}_${Date.now()}`,
          name,
          location: fullAddress,
          city,
          cuisine: match[3].trim(),
          menuItems,
          image: image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80`
        });
      }
    });

    // If text parsing failed, try to use grounding metadata but with better labels
    if (results.length === 0) {
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        let citySuffix = "";
        if (latitude && longitude) {
          const city = await getCurrentCity(latitude, longitude);
          if (city) citySuffix = `, ${city}`;
        }

        groundingChunks.forEach((chunk: any, index: number) => {
          if (chunk.maps) {
            const name = chunk.maps.title || "Unknown Place";
            results.push({
              id: `maps_${index}_${Date.now()}`,
              name,
              location: `Located near current area${citySuffix}`,
              city: citySuffix.replace(', ', '') || "Nearby",
              cuisine: "Food Place",
              mapsUrl: chunk.maps.uri,
              image: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80`
            });
          }
        });
      }
    }

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
      model: "gemini-3-flash-preview",
      contents: `What is the name of the city or town at coordinates ${latitude}, ${longitude} in India? Return ONLY the name of the city or town (e.g., "Mumbai", "Indiranagar").`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude, longitude }
          }
        }
      },
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
