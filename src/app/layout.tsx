import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nimbus — Cloud Oracle Gratuit, Guide de Déploiement 2026",
  description: "Déployez votre cloud personnel gratuit avec Oracle Cloud. 2-4 OCPU, 12-24 Go RAM, 200 Go stockage. Guide complet étape par étape.",
  keywords: "oracle cloud, cloud gratuit, always free, nextcloud, auto-hébergement, VPS gratuit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#0a0e1a] text-white antialiased">{children}</body>
    </html>
  );
}
