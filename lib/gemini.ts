const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash-latest";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export function getGeminiConfig() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("La variable de entorno GOOGLE_GEMINI_API_KEY es obligatoria");
  }

  const model = process.env.GOOGLE_GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  return {
    apiKey,
    model,
    endpoint: `${GEMINI_BASE_URL}/${model}:streamGenerateContent`
  };
}
