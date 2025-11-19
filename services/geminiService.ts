import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Sermon, Event } from "../types";

const API_KEY = process.env.API_KEY || ''; 

// Initialize client only if key exists
const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check if error is quota related
const isQuotaError = (error: any) => {
  return error?.status === 429 || 
         error?.code === 429 || 
         error?.message?.includes('429') || 
         error?.message?.includes('quota') ||
         error?.error?.code === 429 ||
         error?.status === 'RESOURCE_EXHAUSTED';
};

async function retryOperation<T>(operation: () => Promise<T>, retries = 1, delayMs = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // If it is a quota error, fail fast so we use fallback immediately.
    // Retrying usually doesn't help with "Exceeded current quota" (daily/monthly limits).
    if (isQuotaError(error)) {
      throw error;
    }

    if (retries > 0) {
      // console.warn(`Gemini API Retry (${retries} left)...`);
      await delay(delayMs);
      return retryOperation(operation, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

export const getVerseOfDay = async (): Promise<{ verse: string; reference: string }> => {
  // Default Fallback
  const fallback = { verse: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" };

  if (!API_KEY) return { verse: "For I know the plans I have for you...", reference: "Jeremiah 29:11" };

  try {
    return await retryOperation(async () => {
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
    });
  } catch (error) {
    // Only log real errors, suppress quota noise
    if (!isQuotaError(error)) {
        console.error("Gemini Verse Error:", error);
    }
    return fallback;
  }
};

export const seedSermons = async (): Promise<Sermon[]> => {
  const fallback: Sermon[] = [
    { id: 's1', title: 'Walking in Faith', speaker: 'Pastor John', date: '2023-10-01', description: 'Understanding how to trust God in difficult times.', imageUrl: 'https://picsum.photos/400/250?random=1' },
    { id: 's2', title: 'The Power of Community', speaker: 'Sarah Smith', date: '2023-10-08', description: 'Why we need each other to grow spiritually.', imageUrl: 'https://picsum.photos/400/250?random=2' },
    { id: 's3', title: 'Grace Abounds', speaker: 'Mike Jones', date: '2023-10-15', description: 'Exploring the endless grace available to us.', imageUrl: 'https://picsum.photos/400/250?random=3' },
    { id: 's4', title: 'Servant Leadership', speaker: 'Pastor John', date: '2023-10-22', description: 'Learning to lead by serving others first.', imageUrl: 'https://picsum.photos/400/250?random=4' },
    { id: 's5', title: 'Hope for Tomorrow', speaker: 'Anna White', date: '2023-10-29', description: 'Finding hope in the promises of Scripture.', imageUrl: 'https://picsum.photos/400/250?random=5' }
  ];

  if (!API_KEY) return [];

  try {
    return await retryOperation(async () => {
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
    });
  } catch (error) {
    if (!isQuotaError(error)) {
        console.error("Gemini Sermon Seed Error:", error);
    }
    return fallback;
  }
};

export const seedEvents = async (): Promise<Event[]> => {
  const fallback: Event[] = [
    { id: 'e1', title: 'Community Picnic', date: 'Saturday, 12:00 PM', location: 'Central Park', description: 'Join us for food, games, and fellowship in the park.' },
    { id: 'e2', title: 'Worship Night', date: 'Friday, 7:00 PM', location: 'Main Hall', description: 'An evening of acoustic worship and prayer.' },
    { id: 'e3', title: 'Youth Group Meetup', date: 'Wednesday, 6:30 PM', location: 'Youth Center', description: 'Fun activities and bible study for teens.' },
    { id: 'e4', title: 'Volunteer Orientation', date: 'Sunday, 9:00 AM', location: 'Room 101', description: 'Learn how you can serve in our various ministries.' },
    { id: 'e5', title: 'Bible Study: Romans', date: 'Tuesday, 7:00 PM', location: 'Online Zoom', description: 'Deep dive into the book of Romans.' }
  ];

  if (!API_KEY) return [];

  try {
    return await retryOperation(async () => {
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
    });
  } catch (error) {
    if (!isQuotaError(error)) {
        console.error("Gemini Event Seed Error:", error);
    }
    return fallback;
  }
};

export const generatePrayerResponse = async (request: string): Promise<string> => {
  const fallback = "We are standing with you in prayer. May God's peace fill your heart.";
  if (!API_KEY) return fallback;

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Write a short, encouraging, faith-based response (max 30 words) to this prayer request: "${request}"`,
    }));
    return response.text || "Praying for you.";
  } catch (error) {
    // Quiet failure for prayer response
    return fallback;
  }
};