const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => fetchAPI<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: any) =>
    fetchAPI<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any) =>
    fetchAPI<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    fetchAPI<T>(endpoint, { method: 'DELETE' }),

  patch: <T>(endpoint: string, body?: any) =>
    fetchAPI<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
