import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { Sermon, Event, PrayerRequest } from "../types";

const API_KEY = process.env.API_KEY || ''; 

// Initialize client only if key exists to avoid immediate crash on load, 
// though usage will fail if not provided.
const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

export const getVerseOfDay = async (): Promise<{ verse: string; reference: string }> => {
  if (!API_KEY) return { verse: "For I know the plans I have for you...", reference: "Jeremiah 29:11" };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Give me an inspiring Bible verse for a church community app. Return JSON.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verse: { type: Type.STRING },
            reference: { type: Type.STRING }
          },
          required: ["verse", "reference"]
        }
      }
    });
    
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("No text returned");
  } catch (error) {
    console.error("Gemini Verse Error:", error);
    return { verse: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" };
  }
};

export const seedSermons = async (): Promise<Sermon[]> => {
  if (!API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate 5 fictional Christian sermon titles, speakers, dates, and descriptions for a micro church network.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              speaker: { type: Type.STRING },
              date: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "speaker", "date", "description"]
          }
        }
      }
    });

    const raw = JSON.parse(response.text || "[]");
    return raw.map((item: any, index: number) => ({
      id: `sermon-${Date.now()}-${index}`,
      ...item,
      imageUrl: `https://picsum.photos/400/250?random=${index + 10}`
    }));
  } catch (error) {
    console.error("Gemini Sermon Seed Error:", error);
    return [];
  }
};

export const seedEvents = async (): Promise<Event[]> => {
  if (!API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate 5 fictional upcoming church events.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "date", "location", "description"]
          }
        }
      }
    });

    const raw = JSON.parse(response.text || "[]");
    return raw.map((item: any, index: number) => ({
      id: `event-${Date.now()}-${index}`,
      ...item
    }));
  } catch (error) {
    console.error("Gemini Event Seed Error:", error);
    return [];
  }
};

export const generatePrayerResponse = async (request: string): Promise<string> => {
  if (!API_KEY) return "We are praying for you. God bless.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Write a short, encouraging, faith-based response (max 30 words) to this prayer request: "${request}"`,
    });
    return response.text || "Praying for you.";
  } catch (error) {
    console.error("Gemini Prayer Response Error:", error);
    return "May God's peace be with you.";
  }
};
