<<<<<<< HEAD
import Groq from 'groq-sdk';
import 'dotenv/config';

// Initialize Groq AI SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_api_key_to_prevent_startup_crash'
=======
import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
>>>>>>> 817daab (Initial commit to PulseFlow)
});

export async function predictTriageLevel(chiefComplaint, vitals) {
  try {
<<<<<<< HEAD
    const prompt = `
You are an expert triage nurse.

Given a patient's chief complaint and vital signs, predict the Emergency Severity Index (ESI) level from 1 (most severe) to 5 (least severe).

Provide a brief rationale.

Return ONLY a valid JSON object with exactly this structure:
{
  "esiLevel": number,
  "rationale": "string"
}

Patient Chief Complaint: ${chiefComplaint}

Vitals: ${JSON.stringify(vitals)}
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: 'system',
          content:
            'You are an expert emergency department triage assistant. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: {
        type: 'json_object'
      }
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq returned an empty response');
    }

    const result = JSON.parse(content);

    // Basic validation
    const esiLevel = Number(result.esiLevel);

    if (!Number.isInteger(esiLevel) || esiLevel < 1 || esiLevel > 5) {
      throw new Error(`Invalid ESI level returned by Groq: ${result.esiLevel}`);
=======
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing from .env");

      return {
        esiLevel: null,
        status: "MANUAL_REVIEW",
        rationale: "AI service is not configured. Manual triage required.",
      };
    }

    const prompt = `
You are an emergency department triage assistant.

Analyze the patient's chief complaint and vital signs and estimate the
Emergency Severity Index (ESI) level from 1 to 5.

ESI:
1 = Immediate life-saving intervention required
2 = High-risk/emergency condition
3 = Stable but requires multiple resources
4 = Requires one resource
5 = Requires no resources

Return ONLY valid JSON in exactly this format:

{
  "esiLevel": 1,
  "rationale": "Brief explanation"
}

Patient Chief Complaint:
${chiefComplaint}

Patient Vitals:
${JSON.stringify(vitals)}
`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are an emergency triage assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
      temperature: 0.1,
    });

    const text = response?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("Groq returned an empty response.");
    }

    const result = JSON.parse(text);

    const esiLevel = Number(result.esiLevel);

    if (!Number.isInteger(esiLevel) || esiLevel < 1 || esiLevel > 5) {
      throw new Error(`Invalid ESI level returned: ${result.esiLevel}`);
>>>>>>> 817daab (Initial commit to PulseFlow)
    }

    return {
      esiLevel,
<<<<<<< HEAD
      rationale: String(result.rationale || 'No rationale provided.')
    };

  } catch (error) {
    console.error('Groq AI Prediction Error:', error);

    return {
      esiLevel: 3,
      rationale: 'Default fallback due to AI prediction error.'
=======
      status: "AI_PREDICTED",
      rationale:
        result.rationale || "AI-generated triage assessment.",
    };
  } catch (error) {
    console.error("AI Prediction Error:", error);

    return {
      esiLevel: null,
      status: "MANUAL_REVIEW",
      rationale:
        "AI prediction is temporarily unavailable. Manual triage assessment required.",
>>>>>>> 817daab (Initial commit to PulseFlow)
    };
  }
}