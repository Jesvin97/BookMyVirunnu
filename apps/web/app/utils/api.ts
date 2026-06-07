const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "/proxy-api";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
};
const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers);

  // Retrieve JWT token if stored in localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bv_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Set default content type to JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || "An unexpected error occurred.";
    throw new Error(errorMessage);
  }

  // Return the data payload directly if success: true is specified by the API utility
  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: any, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: any, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
