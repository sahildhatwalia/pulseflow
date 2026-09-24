import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Initialize the Google Gen AI SDK
// Uses the environment variable if present, otherwise falls back to a dummy key to prevent crashes on startup.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy_api_key_to_prevent_startup_crash'
});

export async function predictTriageLevel(chiefComplaint, vitals) {
  try {
    const prompt = `
      You are an expert triage nurse. Given a patient's chief complaint and vitals, 
      predict the Emergency Severity Index (ESI) level from 1 (most severe) to 5 (least severe).
      Provide a brief rationale. 
      Return ONLY a JSON object with this structure:
      {
        "esiLevel": number,
        "rationale": "string"
      }
      
      Patient Chief Complaint: ${chiefComplaint}
      Vitals: ${JSON.stringify(vitals)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("AI Prediction Error:", error);
    return {
      esiLevel: 3,
      rationale: "Default fallback due to AI prediction error."
    };
  }
}
