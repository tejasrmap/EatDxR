import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const query = "tacos";
  const latitude = 17.385;
  const longitude = 78.486;
  const locationPrompt = `near the location at coordinates ${latitude}, ${longitude}.`;

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
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text?.replace(/```json/gi, '').replace(/```/g, '').trim() || "[]";
    console.log("RAW TEXT:", text);
    const parsed = JSON.parse(text);
    console.log("PARSED ALIVE:", parsed.length);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}

test();
