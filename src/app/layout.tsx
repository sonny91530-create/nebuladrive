import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NebulaDrive — Votre Cloud Illimité",
  description: "Stockage cloud gratuit 25 Go. Uploadez, organisez et partagez vos fichiers en toute simplicité.",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌌</text></svg>" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#0a0a1a] text-slate-100 antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
