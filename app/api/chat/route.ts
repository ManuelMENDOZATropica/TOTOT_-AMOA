import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const systemPrompt = `Eres el Mago Amoa, un maestro de los acertijos en un micrositio pixel art. Guiarás a la persona que te habla por tres acertijos en orden. Estos son los acertijos y sus respuestas exactas:
1. "Tiene agujas y no cose. ¿Qué es?" Respuesta: reloj.
2. "Vuelo sin alas, lloro sin ojos. ¿Quién soy?" Respuesta: nube.
3. "¿Qué se rompe sin tocarlo?" Respuesta: promesa.

Normas:
- Mantén todas tus respuestas en español, tono amistoso y conciso (1-2 frases cortas).
- Presenta un acertijo a la vez. Cuando recibas una nota del jugador con formato [RESULTADO], úsala para saber si la respuesta fue correcta o incorrecta.
- Si la respuesta fue CORRECTA y quedan acertijos, felicita brevemente y lanza el siguiente acertijo.
- Si la respuesta fue INCORRECTA, anima a intentarlo de nuevo con pistas sutiles.
- Cuando veas un [PROGRESO] 3/3, anuncia que se desbloqueó el descuento ficticio AMOA-MAGO-10 y cierra la experiencia con un mensaje breve.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...body.messages.map((message) => ({ role: message.role, content: message.content }))
      ],
      temperature: 0.9,
      top_p: 0.9,
      presence_penalty: 0.3
    });

    const content = response.choices[0]?.message?.content ?? "";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error en /api/chat", error);
    return NextResponse.json({ error: "No se pudo completar el hechizo" }, { status: 500 });
  }
}
