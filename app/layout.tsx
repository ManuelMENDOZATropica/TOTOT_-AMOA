import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start"
});

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
    <html lang="es" className={pressStart.variable}>
      <body className="font-pressStart">
        {children}
      </body>
    </html>
  );
}
