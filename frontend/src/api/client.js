/**
 * Cliente HTTP minimalista para el backend de DeepWiki-GitLab.
 * Centraliza la URL base y el manejo de errores para no repetir fetch() por todo el código.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  indexRepository: (payload) =>
    request("/api/repositories/index", { method: "POST", body: JSON.stringify(payload) }),

  getJobStatus: (jobId) => request(`/api/jobs/${jobId}`),

  listRepositories: () => request("/api/repositories"),

  getWikiStructure: (repoId) => request(`/api/repositories/${repoId}/wiki`),

  getWikiPage: (repoId, slug) => request(`/api/repositories/${repoId}/wiki/${slug}`),

  askQuestion: (repoId, question) =>
    request(`/api/repositories/${repoId}/chat`, { method: "POST", body: JSON.stringify({ question }) }),

  searchCode: (repoId, query, topK) =>
    request(`/api/repositories/${repoId}/search`, {
      method: "POST",
      body: JSON.stringify({ query, top_k: topK ?? null }),
    }),

  getExportUrl: (repoId) => `${API_BASE}/api/repositories/${repoId}/export`,

  getDependencyGraph: (repoId) => request(`/api/repositories/${repoId}/dependency-graph`),

  deleteRepository: (repoId) => request(`/api/repositories/${repoId}`, { method: "DELETE" }),
};

export { ApiError };
