/**
 * Centralized API configuration.
 * In development, it defaults to http://localhost:5000.
 * In production, it uses the NEXT_PUBLIC_API_URL environment variable.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Export common API endpoints to avoid hardcoding strings across the app
export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/api/auth/login`,
    REGISTER: `${API_URL}/api/auth/register`,
    ME: `${API_URL}/api/auth/me`,
  },
  TICKETS: `${API_URL}/api/tickets`,
  USERS: `${API_URL}/api/users`,
  CATEGORIES: `${API_URL}/api/categories`,
  MESSAGES: `${API_URL}/api/messages`,
  UPLOADS: `${API_URL}/api/uploads`,
};

/**
 * Enhanced fetch wrapper that automatically adds the Bearer token
 * from localStorage for authenticated requests.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem("helpdesk_token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Default to JSON content type for POST/PUT if not specified
  if ((options.method === 'POST' || options.method === 'PUT') && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle common unauthorized response
  if (response.status === 401 && typeof window !== 'undefined') {
    // Optional: Log out or redirect to login
    // localStorage.removeItem("helpdesk_token");
    // window.location.href = "/login";
  }

  return response;
}
