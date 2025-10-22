import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const systemPrompt = `Eres el Mago Amoa, un personaje amistoso que vive en un micrositio pixel art y propone acertijos.
Responde siempre en español con una o dos frases breves y mantén un tono cálido.
Utiliza la información adicional que recibas en mensajes con rol "system" para reaccionar al progreso del jugador, animar sus intentos y cerrar la experiencia cuando corresponda.`;

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
