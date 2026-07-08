const API_BASE = "";

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("cloud_token") : null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
  return data;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; name: string }) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/api/auth/me"),

  // Folders
  getFolders: (parentId?: number | null) =>
    request(`/api/folders${parentId ? `?parentId=${parentId}` : ""}`),
  createFolder: (body: { name: string; parentId?: number | null }) =>
    request("/api/folders", { method: "POST", body: JSON.stringify(body) }),
  deleteFolder: (id: number) =>
    request(`/api/folders/${id}`, { method: "DELETE" }),
  renameFolder: (id: number, name: string) =>
    request(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),

  // Files
  getFiles: (params?: { folderId?: number | null; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.folderId) sp.set("folderId", params.folderId.toString());
    if (params?.search) sp.set("search", params.search);
    const qs = sp.toString();
    return request(`/api/files${qs ? `?${qs}` : ""}`);
  },
  uploadFiles: (formData: FormData) =>
    request("/api/files", { method: "POST", body: formData }),
  deleteFile: (id: number) =>
    request(`/api/files/${id}`, { method: "DELETE" }),
  updateFile: (id: number, body: { name?: string; folderId?: number | null; isPublic?: boolean }) =>
    request(`/api/files/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getFile: (id: number) =>
    request(`/api/files/${id}`),
  shareFile: (id: number) =>
    request(`/api/files/${id}/share`, { method: "POST" }),
  unshareFile: (id: number) =>
    request(`/api/files/${id}/share`, { method: "DELETE" }),
  getShareInfo: (token: string) =>
    request(`/api/share/${token}`),

  // Download URL helper
  downloadUrl: (id: number, token?: string) => {
    const t = token || (typeof window !== "undefined" ? localStorage.getItem("cloud_token") : null);
    const params = new URLSearchParams();
    if (t) params.set("token", t);
    return `/api/files/${id}/download${params.toString() ? `?${params.toString()}` : ""}`;
  },
  shareDownloadUrl: (id: number, shareToken: string) =>
    `/api/files/${id}/download?token=${shareToken}`,
};

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
