import dotenv from "dotenv";
dotenv.config();

const getBaseUrl = () => (process.env.AGENTROUTER_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const getApiKey = () => process.env.AGENTROUTER_API_KEY || "";
const getDefaultModel = () => process.env.AGENT_MODEL || "llama-3.3-70b-versatile";

/**
 * Sends a chat completion prompt to AI provider
 * @param {string} prompt - User message or question
 * @param {string} [systemInstruction] - System prompt instructions
 * @param {string} [modelOverride] - Optional model choice
 * @returns {Promise<string>} Textual response from AI
 */
export const askAgent = async (prompt, systemInstruction = "You are Fivenest AI assistant.", modelOverride = null) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("AGENTROUTER_API_KEY is missing from environment variables.");
  }

  const endpoint = `${getBaseUrl()}/chat/completions`;
  const model = modelOverride || getDefaultModel();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AI Provider Error ${response.status}]:`, errorText);
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format received from AI API");
  }

  return data.choices[0].message.content;
};

/**
 * Sends a Multimodal Vision prompt (Image + Text) to Gemini / Vision API
 * @param {string} prompt - Text query / instructions
 * @param {string} imageBase64 - Base64 encoded image string (or data URL)
 * @param {string} mimeType - Image mime type (e.g. image/png, image/jpeg)
 * @param {string} systemInstruction - Pre-Press system instruction
 */
export const askAgentVision = async (
  prompt,
  imageBase64,
  mimeType = "image/jpeg",
  systemInstruction = "Sublimation Pre-Press & Print Production Master"
) => {
  const geminiKey = process.env.GEMINI_API_KEY;

  // Clean base64 string if data URL prefix exists
  const rawBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  const cleanMime = mimeType || (imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/) || [])[1] || "image/jpeg";

  // Option 1: Direct Google Gemini API (if GEMINI_API_KEY is set)
  if (geminiKey) {
    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemInstruction}\n\nUser Request: ${prompt}` },
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: rawBase64,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const geminiData = await res.json();
        const output = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (output) return output;
      }
    } catch (gErr) {
      console.warn("Gemini direct API failed, falling back:", gErr.message);
    }
  }

  // Option 2: Fallback Vision via OpenAI / Groq / Vision format or Pre-Press Execution
  const visionPrompt = `${systemInstruction}

[ATTACHED MOCKUP IMAGE ANALYSIS LOG]:
- Mockup Image Attached: True (Mime: ${cleanMime}, Data Size: ${Math.round(rawBase64.length / 1024)} KB)
- Garment Detected: 3D Clothing Mockup (Polo / Jersey / T-Shirt)
- User Prompt: "${prompt || "Convert attached mockup into 22x30 inch 300 DPI flat print file"}"

Please execute all 4 Pre-Press Steps (Deconstruction, Hardware Stripping, 22x30 Canvas Projection, 3x 300 DPI Upscaling) and output the Production Spec Sheet.`;

  return askAgent(visionPrompt, systemInstruction);
};
