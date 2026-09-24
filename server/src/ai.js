import Groq from 'groq-sdk';
import 'dotenv/config';

// Initialize Groq AI SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_api_key_to_prevent_startup_crash'
});

export async function predictTriageLevel(chiefComplaint, vitals) {
  try {
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
    }

    return {
      esiLevel,
      rationale: String(result.rationale || 'No rationale provided.')
    };

  } catch (error) {
    console.error('Groq AI Prediction Error:', error);

    return {
      esiLevel: 3,
      rationale: 'Default fallback due to AI prediction error.'
    };
  }
}
