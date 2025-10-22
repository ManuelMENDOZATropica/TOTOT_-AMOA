"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "@/components/Stage";
import { ChatInput } from "@/components/ChatInput";
import {
  extractAciertos,
  extractEmotion,
  hasDiscount,
  stripTags,
  type MageState
} from "@/lib/chatTags";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const [mageState, setMageState] = useState<MageState>("neutro");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [, setSuccessCount] = useState(0);
  const [showDiscount, setShowDiscount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastAssistantMessage = messages
    .filter((message) => message.role === "assistant")
    .map((message) => message.content)
    .pop();

  const lastAssistantDisplay = lastAssistantMessage ? stripTags(lastAssistantMessage) : undefined;

  const defaultIntro =
    "¡Bienvenido a Amoa! Soy el mago de los acertijos. Pulsa 'Empezar' cuando quieras jugar.";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const updateMageState = useCallback((state: MageState) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMageState(state);

    if (state === "feliz" || state === "furioso") {
      timeoutRef.current = setTimeout(() => {
        setMageState("neutro");
      }, 2000);
    }
  }, []);

  const sendMessage = useCallback(
    async (rawContent: string) => {
      const trimmed = rawContent.trim();
      if (!trimmed) {
        return;
      }

      setError(null);
      updateMageState("pensando");
      setIsLoading(true);

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const payloadMessages = [...messagesRef.current, userMessage];
      messagesRef.current = payloadMessages;
      setMessages(payloadMessages);
      const requestMessages = payloadMessages;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ messages: requestMessages })
        });

        if (!response.ok) {
          throw new Error("Respuesta no válida del servidor");
        }

        const data = (await response.json()) as { content?: string };
        const assistantContent = data.content?.trim() || "El mago guarda silencio, algo salió mal.";
        const emotion = extractEmotion(assistantContent);
        const aciertos = extractAciertos(assistantContent);
        const unlockedDiscount = hasDiscount(assistantContent) || (aciertos !== null && aciertos >= 3);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: assistantContent
        };

        setMessages((prev) => {
          const nextMessages = [...prev, assistantMessage];
          messagesRef.current = nextMessages;
          return nextMessages;
        });

        if (emotion === "feliz" || emotion === "furioso") {
          updateMageState(emotion);
        } else {
          updateMageState("neutro");
        }

        if (aciertos !== null) {
          setSuccessCount(aciertos);
        }

        if (unlockedDiscount) {
          setShowDiscount(true);
        }
      } catch (caughtError) {
        console.error(caughtError);
        setError("El hechizo falló. Intenta de nuevo.");
        updateMageState("neutro");
      } finally {
        setIsLoading(false);
      }
    },
    [updateMageState]
  );

  const handleStart = async () => {
    if (started) {
      return;
    }

    setStarted(true);
    await sendMessage("Estoy listo para tus acertijos, Mago.");
  };

  const handleSubmit = async () => {
    if (!started || showDiscount || isLoading) {
      return;
    }

    await sendMessage(inputValue);
    setInputValue("");
  };

  const stageText = error ? error : lastAssistantDisplay || defaultIntro;

  const isInputDisabled = isLoading || !started || showDiscount;

  return (
    <main className="min-h-screen w-full text-white">
      <Stage mageState={mageState} text={stageText}>
        {!started ? (
          <button
            type="button"
            onClick={handleStart}
            className="w-full border-2 border-white/60 px-6 py-3 text-lg font-bold uppercase tracking-[0.3em] text-white transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-white/30 disabled:text-white/30"
            disabled={isLoading}
          >
            Empezar
          </button>
        ) : showDiscount ? null : (
          <div className="flex flex-col gap-6">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              disabled={isInputDisabled}
              placeholder={isLoading ? "El mago está pensando..." : "Escribe tu respuesta"}
            />
          </div>
        )}
      </Stage>
    </main>
  );
}
