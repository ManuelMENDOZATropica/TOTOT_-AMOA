export type MageState = "neutro" | "feliz" | "furioso" | "pensando";

const TAG_PATTERN = /\[\[[^\]]+\]\]/g;

export function stripTags(content: string) {
  return content.replace(TAG_PATTERN, "").trim();
}

export function extractEmotion(content: string): MageState {
  const match = content.match(/\[\[EMOCION:(NEUTRO|FELIZ|FURIOSO)\]\]/i);
  if (!match) {
    return "neutro";
  }

  const value = match[1].toLowerCase();
  switch (value) {
    case "feliz":
      return "feliz";
    case "furioso":
      return "furioso";
    default:
      return "neutro";
  }
}

export function extractAciertos(content: string) {
  const match = content.match(/\[\[ACIERTOS:(\d+)\]\]/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

export function hasDiscount(content: string) {
  return /\[\[DESCUENTO:AMOA-MAGO-10\]\]/i.test(content);
}
