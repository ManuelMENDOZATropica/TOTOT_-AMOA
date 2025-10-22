# Amoa Micrositio

Micrositio interactivo construido con Next.js (App Router), TypeScript y TailwindCSS. Presenta tres acertijos guiados por un mago que integra la API de ChatGPT. Al completar los tres acertijos se muestra un descuento ficticio de demostración.

## Requisitos

- Node.js 18+
- pnpm 8+
- Variable de entorno `OPENAI_API_KEY`

## Desarrollo local

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

Crea un archivo `.env.local` en la raíz del proyecto con la clave de OpenAI:

```
OPENAI_API_KEY=tu_api_key_aqui
```

## Despliegue en Vercel

1. Crea un nuevo proyecto en Vercel e importa este repositorio.
2. Configura la variable de entorno `OPENAI_API_KEY` desde el panel de Vercel.
3. Despliega utilizando los comandos por defecto (`pnpm install`, `pnpm build`, `pnpm start`).

## Estructura principal

```
/app
  /api/chat/route.ts   # Endpoint que invoca la API de OpenAI
  /page.tsx            # UI principal y lógica del juego
/components
  Stage.tsx            # Escena pixel art y capas
  ChatInput.tsx        # Input y botón de envío
/lib
  openai.ts            # Cliente de OpenAI (solo en el servidor)
  utils.ts             # Utilidad para concatenar clases CSS
/public/assets         # Recursos gráficos solicitados
```

## Scripts

- `pnpm dev`: inicia el servidor de desarrollo.
- `pnpm build`: construye la aplicación para producción.
- `pnpm start`: ejecuta la aplicación en modo producción.
- `pnpm lint`: ejecuta las comprobaciones de linting de Next.js.
