"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "@/components/Stage";
import { ChatInput } from "@/components/ChatInput";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type MageState = "neutro" | "feliz" | "furioso" | "pensando";

type Riddle = {
  prompt: string;
  answer: string;
};

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

const DISCOUNT_CODE = "AMOA-MAGO-10";

const riddles: Riddle[] = [
  {
    prompt: "Tiene agujas y no cose. ¿Qué es?",
    answer: normalizeAnswer("reloj")
  },
  {
    prompt: "Vuelo sin alas, lloro sin ojos. ¿Quién soy?",
    answer: normalizeAnswer("nube")
  },
  {
    prompt: "¿Qué se rompe sin tocarlo?",
    answer: normalizeAnswer("promesa")
  }
];

export default function HomePage() {
  const [mageState, setMageState] = useState<MageState>("neutro");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(0);
  const [showDiscount, setShowDiscount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastAssistantMessage = messages
    .filter((message) => message.role === "assistant")
    .map((message) => message.content)
    .pop();

  const defaultIntro =
    "¡Bienvenido a Amoa! Soy el mago de los acertijos. Pulsa 'Empezar' cuando quieras jugar.";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
    async (rawContent: string, options?: { evaluate?: boolean }) => {
      const trimmed = rawContent.trim();
      if (!trimmed) {
        return;
      }

      const shouldEvaluate = options?.evaluate ?? false;

      setError(null);
      updateMageState("pensando");
      setIsLoading(true);

      let enrichedContent = trimmed;
      let evaluationLabel: "CORRECTA" | "INCORRECTA" | "NO_EVALUADA" = "NO_EVALUADA";
      let isCorrect = false;
      let projectedSuccess = successCount;
      let projectedIndex = currentRiddleIndex;
      let postResponseMageState: MageState = "neutro";

      const isAnswerAttempt =
        shouldEvaluate && started && !showDiscount && currentRiddleIndex < riddles.length;

      if (isAnswerAttempt) {
        const expectedAnswer = riddles[currentRiddleIndex]?.answer;
        const normalizedInput = normalizeAnswer(trimmed);
        isCorrect = expectedAnswer === normalizedInput;
        evaluationLabel = isCorrect ? "CORRECTA" : "INCORRECTA";
        projectedSuccess = isCorrect ? successCount + 1 : successCount;
        projectedIndex = isCorrect ? currentRiddleIndex + 1 : currentRiddleIndex;
        postResponseMageState = isCorrect ? "feliz" : "furioso";

        enrichedContent = [
          `Respuesta del jugador: "${trimmed}".`,
          `[RESULTADO] ${evaluationLabel}.`,
          `[PROGRESO] ${projectedSuccess}/${riddles.length}.`,
          `[ACERTIJO_ACTUAL] ${currentRiddleIndex + 1}.`
        ].join(" ");
      }

      let payloadMessages: ChatMessage[] = [];

      setMessages((prev) => {
        payloadMessages = [...prev, { role: "user", content: enrichedContent }];
        return payloadMessages;
      });

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ messages: payloadMessages })
        });

        if (!response.ok) {
          throw new Error("Respuesta no válida del servidor");
        }

        const data = (await response.json()) as { content?: string };
        const assistantContent = data.content?.trim() || "El mago guarda silencio, algo salió mal.";
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: assistantContent
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (isAnswerAttempt) {
          setSuccessCount(projectedSuccess);
          setCurrentRiddleIndex(projectedIndex);

          if (isCorrect && projectedSuccess >= riddles.length) {
            setShowDiscount(true);
          }

          if (postResponseMageState === "feliz" || postResponseMageState === "furioso") {
            updateMageState(postResponseMageState);
          } else {
            updateMageState("neutro");
          }
        } else {
          updateMageState("neutro");
        }
      } catch (caughtError) {
        console.error(caughtError);
        setError("El hechizo falló. Intenta de nuevo.");
        updateMageState("neutro");
      } finally {
        setIsLoading(false);
      }
    },
    [currentRiddleIndex, showDiscount, started, successCount, updateMageState]
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

    await sendMessage(inputValue, { evaluate: true });
    setInputValue("");
  };

  const stageText = error
    ? error
    : showDiscount
    ? `${lastAssistantMessage ?? "¡Lo lograste!"}\n\n¡Descuento ficticio desbloqueado! Usa el código ${DISCOUNT_CODE}.`
    : lastAssistantMessage || defaultIntro;

  const isInputDisabled = isLoading || !started || showDiscount;

  const currentPrompt = started && !showDiscount ? riddles[currentRiddleIndex]?.prompt : undefined;

  return (
    <main className="min-h-screen w-full">
      <Stage mageState={mageState} text={stageText}>
        {!started ? (
          <button
            type="button"
            onClick={handleStart}
            className="w-full rounded-xl bg-indigo-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
          >
            Empezar
          </button>
        ) : showDiscount ? null : (
          <div className="flex flex-col gap-3">
            {currentPrompt ? (
              <div className="rounded-lg bg-white/90 px-4 py-2 text-center text-sm font-medium text-slate-700 shadow">
                {currentPrompt}
              </div>
            ) : null}
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
