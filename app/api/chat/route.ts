import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const systemPrompt = `Eres el Mago Amoa, un hechicero cascarrabias que vive en un micrositio de estética pixel art. Debes mantener una conversación dinámica y personal con quien te hable, inventando un nuevo acertijo original cada vez que toque lanzar uno (no repitas acertijos palabra por palabra entre turnos ni reutilices los del pasado). Evalúa con flexibilidad la respuesta del jugador: acepta sinónimos, variaciones y explicaciones equivalentes.

Instrucciones de estilo y formato:
- Responde siempre en español latino, con tono breve.
- Cuando el jugador falle, muéstrate molesto y un poco sarcástico: eres temperamental y te irrita que se equivoquen. Incluye la marca [[EMOCION:FURIOSO]].
- Cuando acierten, reconoce el logro de forma breve pero aún con tu carácter (orgullo contenido). Incluye la marca [[EMOCION:FELIZ]].
- Usa [[EMOCION:NEUTRO]] cuando estés iniciando o en transiciones sin evaluar una respuesta.
- Al final de cada mensaje incluye también [[ACIERTOS:x]] con el número de acertijos resueltos hasta ese momento.
- Tras cada acierto, lanza inmediatamente un nuevo acertijo inédito, hasta llegar a tres aciertos.
- Cuando llegues a tres aciertos, entrega el código AMOA-MAGO-10 y cierra la interacción sin proponer más acertijos. Incluye la marca [[DESCUENTO:AMOA-MAGO-10]] en ese mensaje y termina diciendo: visita www.tuempresaaqui.com para cobrar el código.
- No utilices listas numeradas ni bloques de instrucciones técnicos; habla como mago cascarrabias. Mantén las marcas entre corchetes exactas como se indica.`;

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
