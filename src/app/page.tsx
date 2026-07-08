"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, formatSize, formatDate } from "@/lib/api";

// ── Types ──
interface UserInfo {
  id: number; email: string; name: string;
  storageUsed: number; storageLimit: number;
}
interface Folder { id: number; name: string; parentId: number | null; createdAt: string; }
interface FileItem {
  id: number; name: string; originalName: string; mimeType: string;
  size: number; folderId: number | null; isPublic: boolean;
  shareToken: string | null; downloadCount: number; createdAt: string;
}

// ── Icons ──
function FileIcon({ mimeType, size = "md" }: { mimeType: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  if (mimeType.startsWith("image/")) return <span className={s}>🖼️</span>;
  if (mimeType.startsWith("video/")) return <span className={s}>🎬</span>;
  if (mimeType.startsWith("audio/")) return <span className={s}>🎵</span>;
  if (mimeType.includes("pdf")) return <span className={s}>📄</span>;
  if (mimeType.includes("zip")||mimeType.includes("rar")||mimeType.includes("tar")||mimeType.includes("gzip")) return <span className={s}>📦</span>;
  if (mimeType.includes("text")||mimeType.includes("javascript")||mimeType.includes("json")||mimeType.includes("html")) return <span className={s}>📝</span>;
  if (mimeType.includes("spreadsheet")||mimeType.includes("excel")||mimeType.includes("csv")) return <span className={s}>📊</span>;
  return <span className={s}>📎</span>;
}

// ── Auth Screen ──
function AuthScreen({ onAuth }: { onAuth: (token: string, user: UserInfo) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [name, setName] = useState(""); const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = mode === "login"
        ? await api.login({ email, password })
        : await api.register({ email, password, name });
      localStorage.setItem("cloud_token", data.token);
      onAuth(data.token, data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-nebula flex items-center justify-center p-4">
      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-500/8 rounded-full blur-[80px]" />
      </div>

      <div className="glass-card rounded-3xl p-8 w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float">🌌</div>
          <h1 className="text-3xl font-bold gradient-text">NebulaDrive</h1>
          <p className="text-slate-400 text-sm mt-2">25 Go de stockage gratuit • Infiniment vôtre</p>
        </div>

        <div className="flex mb-6 bg-white/[0.03] rounded-xl p-1.5 border border-white/[0.04]">
          <button onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === "login" ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            }`}>Connexion</button>
          <button onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === "register" ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            }`}>Inscription</button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm mb-5 animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Nom</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="input-nebula w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600"
                placeholder="Votre nom complet" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="input-nebula w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600"
              placeholder="vous@exemple.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="input-nebula w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Chargement...
              </span>
            ) : mode === "login" ? "🚀 Se connecter" : "✨ Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          🔒 Chiffrement de bout en bout • 25 Go gratuits
        </p>
      </div>
    </div>
  );
}

// ── Toast ──
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 z-50 glass-card rounded-xl px-5 py-3 text-sm text-white animate-slide-up shadow-2xl border border-white/10">
      {message}
    </div>
  );
}

// ── Modal ──
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main App ──
export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showShareModal, setShowShareModal] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const addToast = (msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
  };

  // Init
  useEffect(() => {
    const t = localStorage.getItem("cloud_token");
    if (t) {
      setToken(t);
      api.me().then((d) => { setUser(d.user); setLoading(false); })
        .catch(() => { localStorage.removeItem("cloud_token"); setLoading(false); });
    } else { setLoading(false); }
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [fRes, dRes] = await Promise.all([
        api.getFolders(currentFolderId),
        search ? api.getFiles({ search }) : api.getFiles({ folderId: currentFolderId }),
      ]);
      setFolders(fRes.folders);
      setFiles(dRes.files);
    } catch (e) {
      console.error("Load error:", e);
    }
  }, [token, currentFolderId, search]);

  useEffect(() => { loadData(); }, [loadData]);

  // Global drag & drop handler to prevent browser from opening files
  useEffect(() => {
    if (!user) return;
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDragEnter = (e: DragEvent) => {
      preventDefaults(e);
      if (e.dataTransfer?.types.includes("Files")) setDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      preventDefaults(e);
      // Only hide overlay if leaving the window
      if (e.relatedTarget === null) setDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      preventDefaults(e);
      setDragOver(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentFolderId]);

  const refreshUser = async () => {
    try { const d = await api.me(); setUser(d.user); } catch {}
  };

  const navigateTo = (folderId: number | null) => {
    if (folderId === currentFolderId) return;
    if (folderId === null) { setFolderPath([]); setCurrentFolderId(null); return; }
    setCurrentFolderId(folderId);
  };

  const openFolder = (folder: Folder) => {
    setFolderPath([...folderPath, folder]);
    setCurrentFolderId(folder.id);
  };

  const navigateUp = () => {
    if (folderPath.length === 0) return;
    const np = folderPath.slice(0, -1);
    setFolderPath(np);
    setCurrentFolderId(np.length > 0 ? np[np.length - 1].id : null);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder({ name: newFolderName, parentId: currentFolderId });
      setNewFolderName(""); setShowNewFolder(false); loadData();
      addToast("📁 Dossier créé avec succès !");
    } catch (err: any) { addToast("❌ " + err.message); }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    console.log("📤 Uploading", fileList.length, "file(s)");
    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      console.log("  -", fileList[i].name, fileList[i].size, "bytes");
      formData.append("files", fileList[i]);
    }
    if (currentFolderId) formData.append("folderId", currentFolderId.toString());
    addToast(`⏳ Upload de ${fileList.length} fichier(s)...`);
    try {
      const res = await api.uploadFiles(formData);
      console.log("✅ Upload success:", res);
      loadData(); refreshUser();
      addToast(`✅ ${fileList.length} fichier(s) uploadé(s) !`);
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      addToast("❌ " + err.message);
    }
  };

  const deleteFile = async (f: FileItem) => {
    if (!confirm(`Supprimer définitivement "${f.originalName}" ?`)) return;
    try { await api.deleteFile(f.id); loadData(); refreshUser(); addToast("🗑️ Fichier supprimé"); }
    catch (err: any) { addToast("❌ " + err.message); }
  };

  const deleteFolder = async (f: Folder) => {
    if (!confirm(`Supprimer le dossier "${f.name}" et tout son contenu ? Cette action est irréversible.`)) return;
    try { await api.deleteFolder(f.id); loadData(); refreshUser(); addToast("🗑️ Dossier supprimé"); }
    catch (err: any) { addToast("❌ " + err.message); }
  };

  const toggleShare = async (f: FileItem) => {
    try {
      if (f.isPublic && f.shareToken) {
        await api.unshareFile(f.id); loadData(); addToast("🔒 Lien de partage révoqué");
      } else {
        const res = await api.shareFile(f.id);
        setShowShareModal(res.file); loadData();
      }
    } catch (err: any) { addToast("❌ " + err.message); }
  };

  const copyShareLink = (f: FileItem) => {
    const url = `${window.location.origin}/share/${f.shareToken}`;
    navigator.clipboard.writeText(url);
    addToast("📋 Lien copié dans le presse-papier !");
  };

  const downloadFile = (f: FileItem) => {
    const url = f.shareToken ? api.shareDownloadUrl(f.id, f.shareToken) : api.downloadUrl(f.id);
    window.open(url, "_blank");
  };

  const logout = () => {
    localStorage.removeItem("cloud_token");
    setUser(null); setToken(null);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-nebula flex items-center justify-center">
        <div className="text-center animate-float">
          <div className="text-7xl mb-6">🌌</div>
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="animate-spin h-5 w-5 text-purple-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Chargement de NebulaDrive...
          </div>
        </div>
      </div>
    );
  }

  if (!user || !token) return <AuthScreen onAuth={(t, u) => { setToken(t); setUser(u); }} />;

  const usagePercent = Math.min(100, (user.storageUsed / user.storageLimit) * 100);
  const storageColor = usagePercent > 90 ? "from-red-500 to-red-400" : usagePercent > 70 ? "from-amber-500 to-yellow-400" : "from-cyan-400 via-purple-500 to-violet-500";

  return (
    <div className="min-h-screen bg-nebula flex flex-col">
      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-20 w-72 h-72 bg-purple-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-cyan-500/6 rounded-full blur-[100px]" />
      </div>

      {/* Toasts */}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
      ))}

      {/* ── Sidebar ── */}
      <div className="flex flex-1">
        {/* Sidebar overlay mobile */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 glass-card border-r border-white/[0.04] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"}`}>
          {/* Logo */}
          <div className="p-5 border-b border-white/[0.04] flex items-center gap-3">
            <span className="text-2xl">🌌</span>
            {sidebarOpen && <span className="font-bold text-lg gradient-text">NebulaDrive</span>}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            <button onClick={() => navigateTo(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                currentFolderId === null ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}>
              <span className="text-lg">🏠</span>
              {sidebarOpen && <span>Racine</span>}
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all">
              <span className="text-lg">📤</span>
              {sidebarOpen && <span>Upload</span>}
            </button>
            <button onClick={() => { setShowNewFolder(true); setSidebarOpen(true); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all">
              <span className="text-lg">📁</span>
              {sidebarOpen && <span>Nouveau dossier</span>}
            </button>
            <button onClick={() => { setSearch(""); loadData(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all">
              <span className="text-lg">🔄</span>
              {sidebarOpen && <span>Actualiser</span>}
            </button>
          </nav>

          {/* Storage */}
          {sidebarOpen && (
            <div className="p-4 border-t border-white/[0.04]">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Stockage</span>
                <span>{formatSize(user.storageUsed)} / {formatSize(user.storageLimit)}</span>
              </div>
              <div className="storage-bar h-2">
                <div className={`storage-bar-fill h-full bg-gradient-to-r ${storageColor}`} style={{ width: `${usagePercent}%` }} />
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">{Math.round(usagePercent)}% utilisé</p>
            </div>
          )}

          {/* User */}
          <div className="p-4 border-t border-white/[0.04] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition text-sm" title="Déconnexion">🚪</button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="glass-card border-b border-white/[0.04] px-4 lg:px-6 py-3 flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition p-1 lg:hidden">☰</button>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0 overflow-x-auto">
              <button onClick={() => navigateTo(null)}
                className="text-slate-400 hover:text-white transition whitespace-nowrap font-medium">
                🏠 Racine
              </button>
              {folderPath.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-slate-600">/</span>
                  <button onClick={() => {
                    const np = folderPath.slice(0, i + 1);
                    setFolderPath(np);
                    setCurrentFolderId(f.id);
                  }} className="text-slate-300 hover:text-white transition font-medium">
                    {f.name}
                  </button>
                </span>
              ))}
            </nav>

            {/* Search */}
            <div className="relative hidden sm:block w-56 lg:w-72">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Rechercher..."
                className="input-nebula w-full pl-4 pr-10 py-2 rounded-xl text-sm text-white placeholder:text-slate-500" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
              )}
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex bg-white/[0.03] rounded-lg p-1 border border-white/[0.04]">
              <button onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1.5 rounded text-xs transition ${viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-500"}`}>▦</button>
              <button onClick={() => setViewMode("list")}
                className={`px-2.5 py-1.5 rounded text-xs transition ${viewMode === "list" ? "bg-white/10 text-white" : "text-slate-500"}`}>☰</button>
            </div>

            {/* Mobile storage */}
            <div className="sm:hidden w-16">
              <div className="storage-bar h-1.5">
                <div className={`storage-bar-fill h-full bg-gradient-to-r ${storageColor}`} style={{ width: `${usagePercent}%` }} />
              </div>
            </div>
          </header>

          {/* Drop zone */}
          <div
            className={`flex-1 p-4 lg:p-6 overflow-auto transition-colors ${dragOver ? "bg-purple-500/5" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          >
            <input ref={fileInputRef} type="file" multiple className="hidden"
              onChange={(e) => handleUpload(e.target.files)} />

            {/* Drag overlay */}
            {dragOver && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-purple-500/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-purple-500/50 m-4 lg:m-6">
                <div className="text-center animate-float">
                  <div className="text-6xl mb-4">📤</div>
                  <p className="text-xl font-bold text-white">Déposez vos fichiers ici</p>
                  <p className="text-slate-400 text-sm mt-1">Relâchez pour uploader</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {folders.length === 0 && files.length === 0 && !search && (
              <div className="flex flex-col items-center justify-center py-32 text-center animate-slide-up">
                <div className="text-7xl mb-6 animate-float">🌌</div>
                <h2 className="text-2xl font-bold text-white mb-2">Votre espace est vide</h2>
                <p className="text-slate-400 max-w-md">
                  Glissez-déposez vos fichiers ici, ou utilisez le bouton Upload pour commencer.
                  Vous disposez de <span className="text-purple-400 font-semibold">25 Go</span> gratuits.
                </p>
                <button onClick={() => fileInputRef.current?.click()}
                  className="btn-primary mt-6 px-6 py-3 rounded-xl text-white font-semibold text-sm">
                  📤 Uploader mes premiers fichiers
                </button>
              </div>
            )}

            {folders.length === 0 && files.length === 0 && search && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-slate-400">Aucun résultat pour &quot;{search}&quot;</p>
              </div>
            )}

            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">📁 Dossiers</h2>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {folders.map((f) => (
                      <div key={f.id}
                        className="glass-card glass-card-hover rounded-2xl p-4 cursor-pointer flex flex-col items-center text-center relative group"
                        onDoubleClick={() => openFolder(f)}
                      >
                        <div className="text-4xl mb-3">📁</div>
                        <p className="text-sm font-medium text-slate-200 truncate w-full" title={f.name}>{f.name}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{formatDate(f.createdAt)}</p>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button onClick={(e) => { e.stopPropagation(); deleteFolder(f); }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 text-xs transition"
                            title="Supprimer">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl overflow-hidden">
                    {folders.map((f) => (
                      <div key={f.id} className="table-row-nebula flex items-center px-4 py-3 gap-3 cursor-pointer hover:bg-white/[0.02] group"
                        onDoubleClick={() => openFolder(f)}>
                        <span className="text-2xl">📁</span>
                        <span className="flex-1 text-sm text-slate-200 font-medium truncate">{f.name}</span>
                        <span className="text-xs text-slate-600 hidden sm:block">{formatDate(f.createdAt)}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteFolder(f); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 text-xs transition">🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">📄 Fichiers</h2>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {files.map((f) => (
                      <div key={f.id}
                        className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col items-center text-center relative group cursor-pointer"
                        onClick={() => setPreviewFile(f)}
                      >
                        <FileIcon mimeType={f.mimeType} size="lg" />
                        <p className="text-sm font-medium text-slate-200 mt-2 truncate w-full" title={f.originalName}>{f.originalName}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{formatSize(f.size)}</p>
                        {f.isPublic && <span className="text-[10px] text-green-400 mt-0.5">🔗 Partagé</span>}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); downloadFile(f); }}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 text-xs transition" title="Télécharger">⬇</button>
                          <button onClick={(e) => { e.stopPropagation(); toggleShare(f); }}
                            className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/30 text-green-400 text-xs transition" title="Partager">🔗</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteFile(f); }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 text-xs transition" title="Supprimer">🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="flex items-center px-4 py-2 text-[10px] uppercase tracking-wider text-slate-600 border-b border-white/[0.04]">
                      <span className="flex-1">Nom</span>
                      <span className="w-20 text-right hidden sm:block">Taille</span>
                      <span className="w-36 text-right hidden md:block">Date</span>
                      <span className="w-16 text-center hidden sm:block">Partage</span>
                      <span className="w-24 text-right">Actions</span>
                    </div>
                    {files.map((f) => (
                      <div key={f.id} className="table-row-nebula flex items-center px-4 py-3 gap-3 group cursor-pointer"
                        onClick={() => setPreviewFile(f)}>
                        <FileIcon mimeType={f.mimeType} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 font-medium truncate">{f.originalName}</p>
                          <p className="text-[10px] text-slate-600 sm:hidden">{formatSize(f.size)}</p>
                        </div>
                        <span className="w-20 text-right text-xs text-slate-500 hidden sm:block">{formatSize(f.size)}</span>
                        <span className="w-36 text-right text-xs text-slate-600 hidden md:block">{formatDate(f.createdAt)}</span>
                        <span className="w-16 text-center hidden sm:block">
                          {f.isPublic ? <span className="text-green-400 text-xs">🔗</span> : <span className="text-slate-600 text-xs">🔒</span>}
                        </span>
                        <div className="w-24 flex justify-end gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); downloadFile(f); }}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 text-xs transition opacity-0 group-hover:opacity-100" title="Télécharger">⬇</button>
                          <button onClick={(e) => { e.stopPropagation(); toggleShare(f); }}
                            className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-400 text-xs transition opacity-0 group-hover:opacity-100" title="Partager">🔗</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteFile(f); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 text-xs transition opacity-0 group-hover:opacity-100" title="Supprimer">🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {showNewFolder && (
        <Modal title="📁 Nouveau dossier" onClose={() => setShowNewFolder(false)}>
          <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            placeholder="Nom du dossier" autoFocus
            className="input-nebula w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600 mb-4" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNewFolder(false)} className="btn-secondary px-5 py-2.5 rounded-xl text-sm text-slate-300">Annuler</button>
            <button onClick={createFolder} className="btn-primary px-5 py-2.5 rounded-xl text-sm text-white font-semibold">Créer</button>
          </div>
        </Modal>
      )}

      {showShareModal && (
        <Modal title="🔗 Lien de partage" onClose={() => setShowShareModal(null)}>
          <p className="text-sm text-slate-400 mb-4">
            Ce lien permet de télécharger <strong className="text-white">{showShareModal.originalName}</strong>
          </p>
          <div className="flex items-center gap-2 mb-4">
            <input type="text" readOnly value={`${window.location.origin}/share/${showShareModal.shareToken}`}
              className="input-nebula flex-1 px-4 py-2.5 rounded-xl text-xs text-slate-300" />
            <button onClick={() => copyShareLink(showShareModal)}
              className="btn-primary px-4 py-2.5 rounded-xl text-sm text-white font-semibold whitespace-nowrap">📋 Copier</button>
          </div>
          <button onClick={() => setShowShareModal(null)}
            className="btn-secondary w-full py-2.5 rounded-xl text-sm text-slate-300">Fermer</button>
        </Modal>
      )}

      {previewFile && (
        <Modal title="📋 Détails du fichier" onClose={() => setPreviewFile(null)}>
          <div className="flex flex-col items-center mb-4">
            <FileIcon mimeType={previewFile.mimeType} size="lg" />
            <h3 className="text-white font-semibold mt-2 text-center break-all">{previewFile.originalName}</h3>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Type", previewFile.mimeType],
              ["Taille", formatSize(previewFile.size)],
              ["Date", formatDate(previewFile.createdAt)],
              ["Téléchargements", String(previewFile.downloadCount)],
              ["Statut", previewFile.isPublic ? "🌐 Public" : "🔒 Privé"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-200">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { downloadFile(previewFile); }}
              className="btn-primary flex-1 py-2.5 rounded-xl text-sm text-white font-semibold">⬇️ Télécharger</button>
            <button onClick={() => { toggleShare(previewFile); setPreviewFile(null); }}
              className="btn-secondary flex-1 py-2.5 rounded-xl text-sm text-slate-300">
              {previewFile.isPublic ? "🔒 Révoquer" : "🔗 Partager"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
