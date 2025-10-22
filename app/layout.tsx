import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amoa | Mago de los Acertijos",
  description: "Micrositio interactivo Amoa con acertijos guiados por un mago"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans">{children}</body>
    </html>
  );
}
