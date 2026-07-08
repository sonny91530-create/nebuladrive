"use client";

import { useState, useEffect } from "react";
import {
  Folder, File, FileText, Image as ImageIcon, Video, Music, MoreVertical,
  Search, Plus, LayoutGrid, List, Star, Clock, Trash2, HardDrive,
  Download, Share2, ChevronRight, ArrowUpCircle, ExternalLink, Menu,
  X, Shield, Cloud, Terminal, Settings, LogOut, Info, Database, Upload,
  Loader2
} from "lucide-react";

// ============ TYPES ============
interface FileItem {
  id: number;
  name: string;
  size: number;
  type: string;
  isStarred: boolean;
  createdAt: string;
}

interface FolderItem {
  id: number;
  name: string;
  createdAt: string;
}

// ============ UI COMPONENTS ============
function SidebarItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function FileIcon({ type }: { type: string }) {
  if (type.includes("image")) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
  if (type.includes("video")) return <Video className="w-5 h-5 text-purple-400" />;
  if (type.includes("audio")) return <Music className="w-5 h-5 text-pink-400" />;
  if (type.includes("pdf") || type.includes("text")) return <FileText className="w-5 h-5 text-blue-400" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ============ MAIN COMPONENT ============
export default function NebulaDrive() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number } | null>(null);

  // Mock data for demo
  const [folders, setFolders] = useState<FolderItem[]>([
    { id: 1, name: "Projets 2026", createdAt: "2026-07-01" },
    { id: 2, name: "Photos Vacances", createdAt: "2026-06-15" },
    { id: 3, name: "Documents PDF", createdAt: "2026-05-20" },
  ]);

  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: "Presentation_Nebula.pdf", size: 4500000, type: "application/pdf", isStarred: true, createdAt: "2026-07-08" },
    { id: 2, name: "Hero_Section.png", size: 1200000, type: "image/png", isStarred: false, createdAt: "2026-07-08" },
    { id: 3, name: "Background_Video.mp4", size: 85000000, type: "video/mp4", isStarred: true, createdAt: "2026-07-07" },
    { id: 4, name: "Nebula_Auth.ts", size: 12000, type: "text/typescript", isStarred: false, createdAt: "2026-07-06" },
  ]);

  // Handle simulated upload
  const simulateUpload = (name: string, size: number, type: string) => {
    setUploadProgress({ name, progress: 0 });
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 30;
      if (p >= 100) {
        clearInterval(interval);
        setUploadProgress(null);
        const newFile: FileItem = {
          id: Date.now(),
          name,
          size,
          type,
          isStarred: false,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setFiles(prev => [newFile, ...prev]);
      } else {
        setUploadProgress({ name, progress: p });
      }
    }, 400);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const item = e.dataTransfer.items[0];
    if (item) {
      const file = item.getAsFile();
      if (file) {
        simulateUpload(file.name, file.size, file.type);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload(file.name, file.size, file.type);
    }
  };

  const totalStorage = 200 * 1024 * 1024 * 1024; // 200 GB
  const usedStorage = files.reduce((acc, file) => acc + file.size, 0) + (1.2 * 1024 * 1024 * 1024); // mock some extra
  const usagePercent = (usedStorage / totalStorage) * 100;

  return (
    <div className="flex h-screen bg-[#0a0e1a] text-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-blue-600 rounded-full shadow-xl"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 w-72 h-full bg-[#0d111c] border-r border-white/5 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Nebula Drive
              </span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative group/new mb-8">
            <button className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
              <Plus className="w-5 h-5" />
              Nouveau
            </button>
            <div className="absolute top-full left-0 w-full mt-2 hidden group-hover/new:block z-50">
              <div className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1">
                <label className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer rounded-lg transition-colors">
                  <File className="w-4 h-4 text-blue-400" />
                  <span>Fichier</span>
                  <input type="file" className="hidden" onChange={handleFileSelect} />
                </label>
                <label className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer rounded-lg transition-colors">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  <span>Dossier</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    // @ts-ignore
                    webkitdirectory="" 
                    directory="" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) simulateUpload("Nouveau dossier", 0, "folder");
                    }} 
                  />
                </label>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem icon={HardDrive} label="Mes fichiers" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
            <SidebarItem icon={Star} label="Favoris" active={activeTab === "starred"} onClick={() => setActiveTab("starred")} />
            <SidebarItem icon={Clock} label="Récents" active={activeTab === "recent"} onClick={() => setActiveTab("recent")} />
            <SidebarItem icon={Trash2} label="Corbeille" active={activeTab === "trash"} onClick={() => setActiveTab("trash")} />
            <div className="pt-8 pb-4">
              <span className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-600">Guides</span>
            </div>
            <SidebarItem icon={Terminal} label="Config Oracle" onClick={() => window.location.hash = "deploy"} />
            <SidebarItem icon={Database} label="Config Neon" onClick={() => window.location.href = "/neon"} />
          </nav>

          {/* Storage stats */}
          <div className="mt-auto p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Stockage utilisé</span>
              <span className="text-xs font-bold text-blue-400">{Math.round(usagePercent * 10) / 10}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500">
              {formatSize(usedStorage)} sur 200 Go
            </p>
            <button className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg border border-white/5 transition-colors">
              Gérer le stockage
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${isDragging ? "bg-blue-600/5 ring-4 ring-blue-600/20 ring-inset" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-blue-600/10 backdrop-blur-sm pointer-events-none border-4 border-dashed border-blue-500/50 m-4 rounded-3xl">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-4 animate-bounce">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Déposez vos fichiers ici</h2>
            <p className="text-blue-300">Nebula Drive s&apos;occupe du reste</p>
          </div>
        )}

        {/* Upload Progress Toast */}
        {uploadProgress && (
          <div className="fixed bottom-24 right-8 z-[60] w-72 bg-[#161b22] border border-white/10 rounded-2xl p-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center animate-spin">
                <Loader2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold truncate">Envoi de {uploadProgress.name}</h4>
                <p className="text-[10px] text-gray-500">{Math.round(uploadProgress.progress)}% terminé</p>
              </div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0a0e1a]/50 backdrop-blur-xl z-30">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher dans Nebula Drive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold">Utilisateur</div>
                <div className="text-[10px] text-gray-500">nebula-pro@account</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-white/10" />
            </div>
          </div>
        </header>

        {/* Browser Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Breadcrumbs & View Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 hover:text-white cursor-pointer transition-colors">Nebula Drive</span>
              <ChevronRight className="w-4 h-4 text-gray-700" />
              <span className="font-bold text-gray-200">Tous les fichiers</span>
            </div>
            <div className="flex items-center bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-all ${view === "grid" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Folders Section */}
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4 px-1">Dossiers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="group bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.06] hover:border-blue-500/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Folder className="w-6 h-6 text-blue-400" />
                    </div>
                    <button className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-gray-200 mb-1 truncate">{folder.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">{folder.createdAt}</span>
                    <span className="text-[10px] font-bold text-blue-500/70">12 fichiers</span>
                  </div>
                </div>
              ))}
              {/* Add folder button */}
              <button className="border-2 border-dashed border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-400 hover:border-white/10 transition-all group">
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Créer un dossier</span>
              </button>
            </div>
          </div>

          {/* Files Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4 px-1">Fichiers récents</h3>

            {view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="group relative bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden hover:bg-white/[0.06] hover:border-blue-500/30 transition-all"
                  >
                    {/* Preview (Mock) */}
                    <div className="h-32 bg-white/[0.02] flex items-center justify-center relative overflow-hidden">
                      <FileIcon type={file.type} />
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors" />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-200 text-sm truncate">{file.name}</h4>
                          <p className="text-[10px] text-gray-500">{formatSize(file.size)} • {file.createdAt}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {file.isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                          <button className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                          <Download className="w-3 h-3" /> Télécharger
                        </button>
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
                          <Share2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Nom</th>
                      <th className="px-6 py-4">Taille</th>
                      <th className="px-6 py-4">Modifié le</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {files.map((file) => (
                      <tr key={file.id} className="group hover:bg-white/[0.04] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileIcon type={file.type} />
                            <span className="font-medium text-gray-200">{file.name}</span>
                            {file.isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatSize(file.size)}</td>
                        <td className="px-6 py-4 text-gray-500">{file.createdAt}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-gray-600 hover:text-white hover:bg-white/10 rounded-lg">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-white hover:bg-white/10 rounded-lg">
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-white hover:bg-white/10 rounded-lg">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Global Stats bar (floating bottom) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl z-40">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-gray-300">Connexion DB sécurisée</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-gray-300">Oracle Cloud Actif</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors text-gray-500" onClick={() => window.location.hash = "deploy"}>
            <Info className="w-4 h-4" />
            <span className="text-xs font-semibold">Docs</span>
          </div>
        </div>
      </main>
    </div>
  );
}
