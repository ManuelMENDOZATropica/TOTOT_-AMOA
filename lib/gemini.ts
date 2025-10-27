// CAMBIO NECESARIO: Reemplaza gemini-1.5-flash por el modelo más reciente.
export const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export function getGeminiConfig() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("La variable de entorno GOOGLE_GEMINI_API_KEY es obligatoria");
  }

  return {
    apiKey,
    // La URL de tu endpoint ahora usará el modelo gemini-2.5-flash
    endpoint: `${GEMINI_BASE_URL}/${GEMINI_MODEL}:streamGenerateContent`
  };
}