"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, formatSize, formatDate } from "@/lib/api";

interface SharedFile {
  id: number; originalName: string; mimeType: string;
  size: number; shareToken: string; createdAt: string;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <span className="text-7xl">🖼️</span>;
  if (mimeType.startsWith("video/")) return <span className="text-7xl">🎬</span>;
  if (mimeType.startsWith("audio/")) return <span className="text-7xl">🎵</span>;
  if (mimeType.includes("pdf")) return <span className="text-7xl">📄</span>;
  if (mimeType.includes("zip")||mimeType.includes("rar")||mimeType.includes("tar")) return <span className="text-7xl">📦</span>;
  return <span className="text-7xl">📎</span>;
}

export default function SharePage() {
  const params = useParams();
  const token = params?.token as string;
  const [file, setFile] = useState<SharedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getShareInfo(token)
      .then((d) => { setFile(d.file); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-nebula flex items-center justify-center">
        <div className="animate-float text-center">
          <div className="text-7xl mb-6">🌌</div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-nebula flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center animate-slide-up">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Lien invalide</h1>
          <p className="text-slate-400 text-sm">{error || "Ce lien de partage n'est plus valide."}</p>
        </div>
      </div>
    );
  }

  const downloadUrl = api.shareDownloadUrl(file.id, file.shareToken);

  return (
    <div className="min-h-screen bg-nebula flex items-center justify-center p-4">
      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="glass-card rounded-3xl p-8 md:p-10 max-w-md w-full text-center relative z-10 animate-slide-up">
        <div className="mb-6">
          <FileIcon mimeType={file.mimeType} />
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-white mb-3 break-all">
          {file.originalName}
        </h1>

        <div className="flex items-center justify-center gap-3 text-sm text-slate-400 mb-6">
          <span className="bg-white/5 px-3 py-1 rounded-full">{formatSize(file.size)}</span>
          <span className="bg-white/5 px-3 py-1 rounded-full">{formatDate(file.createdAt)}</span>
        </div>

        <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-5 mb-6">
          <p className="text-sm text-slate-300">
            🌌 Un fichier a été partagé avec vous via <span className="gradient-text font-bold">NebulaDrive</span>
          </p>
        </div>

        <a href={downloadUrl}
          className="btn-primary block w-full py-4 rounded-2xl text-white font-bold text-sm text-center">
          ⬇️ Télécharger le fichier
        </a>

        <p className="text-xs text-slate-600 mt-6">
          Propulsé par 🌌 NebulaDrive — 25 Go gratuits
        </p>
      </div>
    </div>
  );
}
