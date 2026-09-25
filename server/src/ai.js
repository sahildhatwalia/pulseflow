import Groq from 'groq-sdk';
import 'dotenv/config';

// Initialize Groq AI SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,

});

export async function predictTriageLevel(chiefComplaint, vitals) {
  try {
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
    }

    return {
      esiLevel,
      status: "AI_PREDICTED",
      rationale: result.rationale || "AI-generated triage assessment.",
    };
  } catch (error) {
    console.error("AI Prediction Error:", error);

    return {
      esiLevel: null,
      status: "MANUAL_REVIEW",
      rationale:
        "AI prediction is temporarily unavailable. Manual triage assessment required.",
    };
  }
}