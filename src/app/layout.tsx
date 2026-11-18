import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Rioja Abierta · El dinero público de La Rioja, a la vista", template: "%s · Rioja Abierta" },
  description: "Licitaciones, adjudicaciones, contratos menores y subvenciones de La Rioja desde fuentes oficiales abiertas. Busca, compara y descarga.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#772541" },
    { media: "(prefers-color-scheme: dark)", color: "#171412" },
  ],
};

// Aplica el tema guardado antes de pintar para evitar parpadeos
const temaInicial = `try{var t=localStorage.getItem('tema');if(t==='oscuro'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES" className={`h-full ${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
