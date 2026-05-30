const defaultApiBaseUrl = "http://127.0.0.1:8788";

function getConfiguredApiBaseUrl() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_AI_PET_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, "");
}

export function apiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return `${getConfiguredApiBaseUrl()}${normalizedPath}`;
  }

  return normalizedPath;
}
