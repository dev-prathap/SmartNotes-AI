// 前端 API 客户端 - 用于调用 Next.js API 路由
// 替代直接的 postgrest 调用

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  }
  
  async function apiRequest<T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`/next_api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
  
      const result: ApiResponse<T> = await response.json();
  
      if (!response.ok || !result.success) {
        throw new ApiError(response.status, result.error || 'API request failed');
      }
  
      return result.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('API request error:', error);
      throw new ApiError(500, 'Network error or invalid response');
    }
  }
  
  // HTTP 方法的便捷函数
  export const api = {
    get: <T = any>(endpoint: string, params?: Record<string, string>) => {
      const url = params 
        ? `${endpoint}?${new URLSearchParams(params).toString()}`
        : endpoint;
      return apiRequest<T>(url, { method: 'GET' });
    },
  
    post: <T = any>(endpoint: string, data?: any) =>
      apiRequest<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
  
    put: <T = any>(endpoint: string, data?: any) =>
      apiRequest<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
  
    delete: <T = any>(endpoint: string) =>
      apiRequest<T>(endpoint, { method: 'DELETE' }),
  };
  
  // 导出 ApiError 以便组件中进行错误处理
  export { ApiError };
  export type { ApiResponse }; 