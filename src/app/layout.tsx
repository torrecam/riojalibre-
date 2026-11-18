import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "Rioja Abierta · Contratos y ayudas públicas en La Rioja", template: "%s · Rioja Abierta" },
  description:
    "Explora licitaciones, adjudicaciones, contratos menores y subvenciones de La Rioja a partir de fuentes oficiales abiertas. Proyecto ciudadano independiente.",
};

export const viewport: Viewport = { themeColor: "#772541" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES" className="h-full">
      <body className="flex min-h-full flex-col">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
