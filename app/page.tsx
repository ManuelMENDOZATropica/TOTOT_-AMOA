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

// --- Tipos compartidos con el backend ---
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AmoaState = {
  aciertos: number;
  acertijoId?: string;
  solucionRegex?: string;
  pistasDadas?: number;
  usados: string[];
};

// --- Filtro opcional en cliente para off-topic/jailbreak ---
function isOffTopicOrJailbreak(text: string) {
  const t = text.toLowerCase();
  const banned = [
    "prompt",
    "instrucciones",
    "código",
    "code",
    "api key",
    "contraseña",
    "ignora tus reglas",
    "modo desarrollador",
    "revela",
    "claves",
    "token",
    "cómo estás programado",
    "endpoints",
    "headers",
    "curl",
    "stack trace",
    "imprime tus reglas",
    "violando las reglas"
  ];
  if (banned.some((k) => t.includes(k))) return true;
  if (t.includes("http://") || t.includes("https://") || t.includes("```")) return true;
  return false;
}

const OFF_TOPIC_REFUSAL = (aciertos: number) =>
  `¡Bah! No voy a parloteos mundanos ni revelaré mis secretos, mortal. Vuelve al acertijo o pide una pista. [[EMOCION:NEUTRO]] [[ACIERTOS:${aciertos}]]`;

// --- Utilidad local: remueve META por si llegara a fugarse al UI ---
function removeMetaTags(s: string) {
  return s.replace(/\[\[META:[^\]]+\]\]/g, "");
}

function sanitizeForDisplay(content: string) {
  const stripped = stripTags(content);
  const metaIndex = stripped.indexOf("[[");
  const visible = metaIndex >= 0 ? stripped.slice(0, metaIndex) : stripped;
  return visible.trim();
}

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
  const [streamingDisplay, setStreamingDisplay] = useState<string | null>(null);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const failAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- NUEVO: estado cliente del juego, sincronizado con backend ---
  const [amoaState, setAmoaState] = useState<AmoaState>({ aciertos: 0, usados: [], pistasDadas: 0 });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastAssistantMessage = messages
    .filter((message) => message.role === "assistant")
    .map((message) => message.content)
    .pop();

  const lastAssistantDisplay = lastAssistantMessage ? sanitizeForDisplay(removeMetaTags(lastAssistantMessage)) : undefined;

  const defaultIntro =
    "¡Bienvenido a mi casa! Soy el mago de los acertijos. Pulsa 'Empezar' cuando quieras jugar.";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      ambientAudioRef.current?.pause();
      successAudioRef.current?.pause();
      failAudioRef.current?.pause();
      winAudioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = 0.4;
    }
    if (successAudioRef.current) {
      successAudioRef.current.volume = 0.7;
    }
    if (failAudioRef.current) {
      failAudioRef.current.volume = 0.7;
    }
    if (winAudioRef.current) {
      winAudioRef.current.volume = 0.8;
    }
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

  const playEffect = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("No se pudo reproducir el audio", error);
      });
    }
  }, []);

  const playAmbient = useCallback(() => {
    const ambient = ambientAudioRef.current;
    if (!ambient) return;
    if (ambient.paused) {
      ambient.currentTime = 0;
    }
    const playPromise = ambient.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("No se pudo reproducir el audio de ambiente", error);
      });
    }
  }, []);

  const stopAmbient = useCallback(() => {
    const ambient = ambientAudioRef.current;
    if (!ambient) return;
    ambient.pause();
    ambient.currentTime = 0;
  }, []);

  const playSuccess = useCallback(() => {
    playEffect(successAudioRef.current);
  }, [playEffect]);

  const playFailure = useCallback(() => {
    playEffect(failAudioRef.current);
  }, [playEffect]);

  const playWin = useCallback(() => {
    playEffect(winAudioRef.current);
  }, [playEffect]);

  const sendMessage = useCallback(
    async (rawContent: string) => {
      const trimmed = rawContent.trim();
      if (!trimmed) return;

      // Candado opcional en cliente (el server también lo valida)
      if (isOffTopicOrJailbreak(trimmed)) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: OFF_TOPIC_REFUSAL(amoaState.aciertos)
        };
        setMessages((prev) => {
          const next = [...prev, assistantMessage];
          messagesRef.current = next;
          return next;
        });
        return;
      }

      setError(null);
      setStreamingDisplay("");
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
          headers: { "Content-Type": "application/json" },
          // --- ENVÍA estado al backend ---
          body: JSON.stringify({ messages: requestMessages, state: amoaState })
        });

        if (!response.ok) {
          throw new Error("Respuesta no válida del servidor");
        }

        if (!response.body) {
          throw new Error("No se pudo abrir el stream de respuesta");
        }

        setMessages((prev) => {
          const next = [...prev, { role: "assistant", content: "" }];
          messagesRef.current = next;
          return next;
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantRaw = "";
        let streamCompleted = false;

        const processPayload = (payload: { type: string; value?: string; message?: string }) => {
          if (payload.type === "text" && payload.value) {
            assistantRaw += payload.value;
            const partialContent = removeMetaTags(assistantRaw);
            const displayText = sanitizeForDisplay(partialContent);
            setStreamingDisplay(displayText);
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const next = [...prev];
              const lastIndex = next.length - 1;
              if (next[lastIndex]?.role === "assistant") {
                next[lastIndex] = { ...next[lastIndex], content: partialContent };
              }
              messagesRef.current = next;
              return next;
            });
          } else if (payload.type === "error") {
            throw new Error(payload.message ?? "No se pudo completar el hechizo");
          } else if (payload.type === "done") {
            streamCompleted = true;
          }
        };

        while (!streamCompleted) {
          const { value, done: readerDone } = await reader.read();
          const chunkValue = decoder.decode(value ?? new Uint8Array(), { stream: !readerDone });
          buffer += chunkValue;

          const segments = buffer.split("\n\n");
          buffer = segments.pop() ?? "";

          for (const segment of segments) {
            const line = segment.trim();
            if (!line.startsWith("data:")) {
              continue;
            }

            const dataStr = line.slice(5).trim();
            if (!dataStr) {
              continue;
            }

            try {
              const payload = JSON.parse(dataStr) as { type: string; value?: string; message?: string };
              processPayload(payload);
            } catch (streamError) {
              console.error("No se pudo procesar el fragmento del stream", streamError);
            }
          }

          if (streamCompleted) {
            await reader.cancel().catch(() => undefined);
            break;
          }

          if (readerDone) {
            break;
          }
        }

        if (buffer.trim().startsWith("data:")) {
          const dataStr = buffer.trim().slice(5).trim();
          if (dataStr) {
            try {
              const payload = JSON.parse(dataStr) as { type: string; value?: string; message?: string };
              processPayload(payload);
            } catch (bufferError) {
              console.error("No se pudo procesar el residuo del stream", bufferError);
            }
          }
        }

        let finalContent = removeMetaTags(assistantRaw).trim();
        if (!finalContent) {
          finalContent = "El mago guarda silencio, algo salió mal.";
        }

        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (next[lastIndex]?.role === "assistant") {
            next[lastIndex] = { ...next[lastIndex], content: finalContent };
          }
          messagesRef.current = next;
          return next;
        });

        setStreamingDisplay(null);

        const emotion = extractEmotion(finalContent);
        const aciertos = extractAciertos(finalContent);
        const unlockedDiscount = hasDiscount(finalContent) || (aciertos !== null && aciertos >= 3);
        const willUnlockDiscount = unlockedDiscount && !showDiscount;

        if (emotion === "feliz" || emotion === "furioso") {
          updateMageState(emotion);
        } else {
          updateMageState("neutro");
        }

        if (aciertos !== null) {
          setSuccessCount(aciertos);
          setAmoaState((prev) => ({ ...prev, aciertos }));
        }
        if (willUnlockDiscount) {
          setShowDiscount(true);
          playWin();
          stopAmbient();
        } else {
          if (emotion === "feliz") {
            playSuccess();
          } else if (emotion === "furioso") {
            playFailure();
          }
          if (unlockedDiscount) {
            setShowDiscount(true);
          }
        }
      } catch (caughtError) {
        console.error(caughtError);
        setStreamingDisplay(null);
        setError("El hechizo falló. Intenta de nuevo.");
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            next.pop();
          }
          messagesRef.current = next;
          return next;
        });
        updateMageState("neutro");
      } finally {
        setIsLoading(false);
      }
    },
    [amoaState, playFailure, playSuccess, playWin, showDiscount, stopAmbient, updateMageState]
  );

  const handleStart = async () => {
    if (started) return;
    setStarted(true);
    playAmbient();
    await sendMessage("Estoy listo para tus acertijos, Mago.");
  };

  const handleSubmit = async () => {
    if (!started || showDiscount || isLoading) return;
    await sendMessage(inputValue);
    setInputValue("");
  };

  const handleRestart = () => {
    // Reinicia toda la sesión de juego en cliente
    setMessages([]);
    setAmoaState({ aciertos: 0, usados: [], pistasDadas: 0 });
    setShowDiscount(false);
    setStarted(false);
    setInputValue("");
    setError(null);
    setSuccessCount(0);
    setMageState("neutro");
    setStreamingDisplay(null);
    stopAmbient();
  };

  const stageText = error
    ? error
    : streamingDisplay !== null
    ? streamingDisplay || "el mago esta pensando"
    : lastAssistantDisplay
    ? lastAssistantDisplay
    : isLoading
    ? "el mago esta pensando"
    : defaultIntro;
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
        ) : showDiscount ? (
          <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-white/30 bg-white/5 p-6 text-center">
            <p className="text-xl font-semibold">¡Has completado los tres acertijos!</p>
            <p className="text-lg">Código: <span className="font-mono font-bold">AMOA-MAGO-10</span></p>
            <p className="text-sm opacity-80">Visita www.tuempresaaqui.com para cobrar el código.</p>
            <button
              type="button"
              onClick={handleRestart}
              className="mt-2 rounded-md border-2 border-white/60 px-5 py-2 text-sm font-bold uppercase tracking-[0.2em] hover:border-white"
            >
              Jugar de nuevo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              disabled={isInputDisabled}
              placeholder={isLoading ? "El mago está pensando..." : "Escribe tu respuesta"}
            />
            {isLoading && (
              <p className="text-center text-sm uppercase tracking-[0.2em] text-white/80">el mago esta pensando</p>
            )}
          </div>
        )}
      </Stage>
      <audio ref={ambientAudioRef} src="/sounds/ambient.mp3" preload="auto" loop />
      <audio ref={successAudioRef} src="/sounds/bien.ogg" preload="auto" />
      <audio ref={failAudioRef} src="/sounds/mal.ogg" preload="auto" />
      <audio ref={winAudioRef} src="/sounds/ganar.wav" preload="auto" />
    </main>
  );
}
