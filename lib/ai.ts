/**
 * AI client untuk Google native endpoint (gemini-web2api proxy).
 *
 * Endpoint: {AI_API_BASE}/v1beta/models/{model}:generateContent
 * Auth: x-goog-api-key
 * Session: X-Session-ID header (multi-turn, 24h TTL di proxy)
 * Vision: inlineData { mimeType, data (base64 tanpa prefix) }
 * Image gen/edit: response berisi data:image/jpeg;base64,... di parts[].text
 */

const AI_API_BASE = (process.env.AI_API_URL || "http://43.156.102.64:8081/v1/chat/completions")
  .replace(/\/v1\/chat\/completions\/?$/, "")
  .replace(/\/$/, "");

export const AI_API_KEY = process.env.AI_API_KEY || "sk-gemini";
export const AI_VISION_MODEL = process.env.AI_VISION_MODEL || "gemini-3.6-flash";
export const AI_TEXT_MODEL = process.env.AI_TEXT_MODEL || "gemini-3.6-flash";
export const AI_IMAGE_MODEL = process.env.AI_IMAGE_MODEL || "gemini-3.6-flash";

export type GooglePart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GoogleContent = {
  role: string;
  parts: GooglePart[];
};

export type GoogleGenerateOptions = {
  model: string;
  systemInstruction?: string;
  contents: GoogleContent[];
  sessionId?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type GoogleGenerateResponse = {
  candidates: Array<{
    index: number;
    content: {
      role: string;
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
};

/** Bangun URL endpoint native untuk model & action tertentu. */
function nativeUrl(model: string, action: "generateContent" | "streamGenerateContent" = "generateContent"): string {
  return `${AI_API_BASE}/v1beta/models/${model}:${action}`;
}

/**
 * Generate content via Google native endpoint.
 * Mengembalikan seluruh response JSON (berisi candidates[].content.parts).
 */
export async function generateContent(opts: GoogleGenerateOptions): Promise<GoogleGenerateResponse | null> {
  const body: Record<string, unknown> = {
    contents: opts.contents,
  };

  if (opts.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: opts.systemInstruction }],
    };
  }

  const generationConfig: Record<string, unknown> = {};
  if (opts.temperature !== undefined) generationConfig.temperature = opts.temperature;
  if (opts.maxOutputTokens !== undefined) generationConfig.maxOutputTokens = opts.maxOutputTokens;
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-goog-api-key": AI_API_KEY,
  };
  if (opts.sessionId) {
    headers["X-Session-ID"] = opts.sessionId;
  }

  const res = await fetch(nativeUrl(opts.model), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[AI] generateContent error: ${res.status}`, errText.slice(0, 500));
    return null;
  }

  return (await res.json()) as GoogleGenerateResponse;
}

/**
 * Ekstrak teks gabungan dari response generateContent.
 */
export function extractText(resp: GoogleGenerateResponse | null): string {
  if (!resp?.candidates?.[0]?.content?.parts) return "";
  return resp.candidates[0].content.parts
    .map((p) => p.text || "")
    .join("");
}

/**
 * Cari data URI gambar pertama di response (image gen / image edit).
 * Return: { dataUri, mimeType, base64 } atau null.
 */
export function extractImage(resp: GoogleGenerateResponse | null): { dataUri: string; mimeType: string; base64: string } | null {
  const text = extractText(resp);
  if (!text) return null;

  const match = text.match(/data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)/);
  if (!match) return null;

  return {
    dataUri: match[0],
    mimeType: match[1],
    base64: match[2],
  };
}

/**
 * Decode base64 → Uint8Array.
 */
export function decodeBase64(b64: string): Uint8Array {
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Strip prefix "data:image/...;base64," → raw base64.
 */
export function stripDataUri(input: string): { mimeType: string; data: string } | null {
  const m = input.match(/data:(image\/[a-z]+);base64,(.*)/);
  if (m) return { mimeType: m[1], data: m[2] };
  return null;
}

/**
 * Extract & parse JSON dari response AI yang mungkin berantakan.
 * Handle: markdown fences, prefix/suffix prose (e.g. "Tentu, silakan..."),
 * multiple JSON blocks, dan plain JSON object.
 */
export function extractJsonFromText<T = unknown>(text: string): T | null {
  if (!text || typeof text !== "string") return null;

  let candidate = text.trim();

  // 1. Coba ekstrak dari markdown code fence ```json ... ``` atau ``` ... ```
  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    candidate = fenceMatch[1].trim();
  }

  // 2. Coba parse langsung (kalau response udah JSON murni)
  try {
    return JSON.parse(candidate) as T;
  } catch {
    // lanjut
  }

  // 3. Cari JSON object dari `{` pertama sampai `}` terakhir
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = candidate.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // lanjut
    }
  }

  // 4. Cari JSON array
  const arrStart = candidate.indexOf("[");
  const arrEnd = candidate.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const slice = candidate.slice(arrStart, arrEnd + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // lanjut
    }
  }

  return null;
}
