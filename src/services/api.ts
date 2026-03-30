const API_BASE = typeof window !== "undefined" 
  ? `${window.location.protocol}//${window.location.hostname}:3080/api`
  : "http://localhost:3080/api";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.text();
    return { error: error || `HTTP ${response.status}` };
  }
  
  if (response.status === 204) {
    return { data: undefined as T };
  }
  
  const data = await response.json();
  return { data };
}

export const api = {
  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return handleResponse<T>(response);
    } catch (error) {
      return { error: "Erro de conexão com o servidor" };
    }
  },

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return handleResponse<T>(response);
    } catch (error) {
      return { error: "Erro de conexão com o servidor" };
    }
  },

  async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return handleResponse<T>(response);
    } catch (error) {
      return { error: "Erro de conexão com o servidor" };
    }
  },

  async delete(path: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      return handleResponse<void>(response);
    } catch (error) {
      return { error: "Erro de conexão com o servidor" };
    }
  },
};

export default api;
