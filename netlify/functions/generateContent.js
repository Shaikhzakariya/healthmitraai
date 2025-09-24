// netlify/functions/generateContent.js
import fetch from "node-fetch";

export async function handler(event, context) {
  const payload = JSON.parse(event.body);

  const apiKey = process.env.LLM_API_KEY; // stored securely in Netlify env
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return { statusCode: response.status, body: `API error: ${response.status}` };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    return { statusCode: 500, body: `Server error: ${error.message}` };
  }
}
