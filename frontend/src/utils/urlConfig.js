const normalizeUrl = (value) => value.replace(/\/+$/, "");

const isLocalhostHost = (host) => host === "localhost" || host === "127.0.0.1";

export const getApiBaseUrl = () => {
  // 1. Detect if we are running in a local browser context
  if (
    typeof window !== "undefined" &&
    isLocalhostHost(window.location.hostname)
  ) {
    return "https://job-portal-k8nz.onrender.com";
  }

  // 2. Fallback to explicitly configured URL (production)
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredApiUrl) {
    return normalizeUrl(configuredApiUrl);
  }

  // 3. Fallback to derived API endpoint based on origin
  if (typeof window !== "undefined") {
    return `${normalizeUrl(window.location.origin)}/api`;
  }

  return "http://localhost:5000/api";
};

export const getSocketBaseUrl = () => {
  // 1. Detect if we are running in a local browser context
  if (
    typeof window !== "undefined" &&
    isLocalhostHost(window.location.hostname)
  ) {
    return "http://localhost:5000";
  }

  // 2. Fallback to explicitly configured URL (production)
  const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
  if (configuredSocketUrl) {
    return normalizeUrl(configuredSocketUrl).replace(/\/api$/, "");
  }

  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredApiUrl) {
    return normalizeUrl(configuredApiUrl).replace(/\/api$/, "");
  }

  // 3. Fallback to derived origin
  if (typeof window !== "undefined") {
    return normalizeUrl(window.location.origin);
  }

  return "http://localhost:5000";
};
