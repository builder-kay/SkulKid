const geminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
export const defaultGeminiModel = "gemini-3.5-flash";

export function resolveGeminiModel(model: string | undefined) {
  if (!model || model === "gemini-2.5-flash") return defaultGeminiModel;
  return model.replace(/^models\//, "");
}

type GeminiStructuredInput = {
  model: string;
  prompt: string;
  mimeType: string;
  bytes: Uint8Array;
  schema: unknown;
};

export class GeminiRequestError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = "GeminiRequestError";
  }
}

export async function generateStructuredWithGemini(input: GeminiStructuredInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiRequestError("GEMINI_API_KEY is not configured on the server.", 503);

  const sourcePart = input.mimeType === "application/pdf"
    ? { inlineData: { mimeType: input.mimeType, data: Buffer.from(input.bytes).toString("base64") } }
    : { text: `SOURCE DOCUMENT:\n${new TextDecoder().decode(input.bytes)}` };

  const response = await fetch(`${geminiBaseUrl}/${encodeURIComponent(input.model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [sourcePart, { text: input.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: input.schema
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new GeminiRequestError(`Gemini request failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const payload = await response.json() as {
    responseId?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    promptFeedback?: { blockReason?: string };
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) {
    const reason = payload.promptFeedback?.blockReason ?? payload.candidates?.[0]?.finishReason ?? "no content";
    throw new GeminiRequestError(`Gemini returned no structured content (${reason}).`);
  }

  try {
    return { data: JSON.parse(text) as unknown, responseId: payload.responseId ?? crypto.randomUUID() };
  } catch {
    throw new GeminiRequestError("Gemini returned content that was not valid JSON.");
  }
}
